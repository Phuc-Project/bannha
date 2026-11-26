/**
 * BẢN NHÀ — Cầu nối Backend FastAPI + Supabase (chỉ bật khi đăng nhập bằng Supabase)
 * ============================================================================
 * - `loadMe()`      : GET  /api/v1/me      -> hồ sơ thật của người dùng (vai trò, lớp, phòng, con).
 * - `pull()`        : POST /api/v1/sync/pull -> kéo dữ liệu mới theo con trỏ từng bảng, đổi sang
 *                     cấu trúc state cục bộ mà các màn hình đang dùng.
 * - `toServerOp()`  : dịch lệnh Outbox cục bộ sang đúng tên lệnh + payload mà backend chấp nhận.
 * Chế độ Demo / Dùng thử không đi qua tệp này.
 */
(function initServerSync(global) {
  const { CONFIG } = global.BanNha;

  const PULL_TABLES = [
    'classes',
    'dorm_rooms',
    'directory',
    'leave_requests',
    'meal_cancellations',
    'menus',
    'room_issues',
    'health_reports',
    'sos_alerts',
    'grades',
    'announcements',
    'scholarships',
    'culture_posts',
  ];
  const MAX_PULL_ROUNDS = 10;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const VN_OFFSET = '+07:00';

  function isEnabled(session) {
    return Boolean(
      CONFIG.api.baseUrl && session?.accessToken && session.authProvider === 'supabase',
    );
  }

  async function apiFetch(path, session, init = {}) {
    const controller = new AbortController();
    const timer = global.setTimeout(() => controller.abort(), CONFIG.api.timeoutMs);
    try {
      const res = await fetch(`${CONFIG.api.baseUrl.replace(/\/$/, '')}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
          ...(session.activeRole ? { 'X-Active-Role': session.activeRole } : {}),
          ...(init.headers || {}),
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.success === false) {
        const error = new Error(body?.error?.message || `Máy chủ trả lỗi ${res.status}.`);
        error.status = res.status;
        throw error;
      }
      return body.data;
    } finally {
      global.clearTimeout(timer);
    }
  }

  // ---------------------------------------------------------------- hồ sơ (/me)
  function profileFromMe(me) {
    return {
      id: me.id,
      code: String(me.username).toUpperCase(),
      fullName: me.full_name,
      roles: me.roles,
      className: me.class_info?.name || null,
      room: me.room_name || null,
      ethnicity: me.ethnicity || null,
      phone: me.phone || null,
      mustChangePassword: Boolean(me.must_change_password),
      childrenIds: (me.children || []).map((c) => c.id),
    };
  }

  function childProfiles(me) {
    return (me.children || []).map((c) => ({
      id: c.id,
      code: '',
      fullName: c.full_name,
      roles: ['student'],
      className: c.class_name || null,
      room: c.room_name || null,
    }));
  }

  async function loadMe(session) {
    const me = await apiFetch('/api/v1/me', session);
    return { me, profile: profileFromMe(me), children: childProfiles(me) };
  }

  // ---------------------------------------------------------------- tiện ích ngày giờ
  function isoDate(value) {
    return value ? String(value).slice(0, 10) : '';
  }

  function shortTime(value) {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? String(value)
      : d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
  }

  function dayLabel(dateIso) {
    const names = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const d = new Date(`${dateIso}T00:00:00${VN_OFFSET}`);
    return Number.isNaN(d.getTime()) ? dateIso : names[d.getUTCDay()] || dateIso;
  }

  function upsertById(list, item) {
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) return list.map((x, i) => (i === idx ? { ...x, ...item } : x));
    return [item, ...list];
  }

  // ---------------------------------------------------------------- ánh xạ hàng DB -> state
  const ISSUE_LABELS = {
    electric: 'Điện chiếu sáng',
    water: 'Nước sinh hoạt',
    door_window: 'Cửa & cửa sổ',
    bed: 'Giường tủ',
    other: 'Khác',
  };
  const SYMPTOM_LABELS = {
    fever: 'Sốt',
    headache: 'Đau đầu',
    stomachache: 'Đau bụng',
    cough: 'Ho',
    dizzy: 'Chóng mặt',
    sore_throat: 'Đau họng',
    vomit: 'Nôn',
    injury: 'Chấn thương',
    other: 'Khác',
  };
  const HEALTH_STATUS = {
    new: 'Phòng Y tế đã tiếp nhận',
    seen: 'Cán bộ Y tế đang theo dõi',
    handled: 'Đã xử lý',
  };
  const GRADE_KIND = { oral: 'oral', '15min': 'quiz15', midterm: 'midterm', final: 'finalExam' };

  function applyRows(s, table, rows) {
    const refs = s.server;
    for (const r of rows) {
      const deleted = Boolean(r.deleted_at);
      if (table === 'classes') refs.classes[r.id] = r.name;
      else if (table === 'dorm_rooms') refs.rooms[r.id] = r.name;
      else if (table === 'directory') applyDirectory(s, r, deleted);
      else if (table === 'leave_requests') applyLeave(s, r, deleted);
      else if (table === 'meal_cancellations') applyMealCut(s, r, deleted);
      else if (table === 'menus') applyMenu(s, r, deleted);
      else if (table === 'room_issues') applyRoomIssue(s, r, deleted);
      else if (table === 'health_reports') applyHealth(s, r, deleted);
      else if (table === 'sos_alerts') applySos(s, r, deleted);
      else if (table === 'grades') applyGrade(s, r, deleted);
      else if (table === 'announcements') applyAnnouncement(s, r, deleted);
      else if (table === 'scholarships') applyScholarship(s, r, deleted);
      else if (table === 'culture_posts') applyCulture(s, r, deleted);
    }
  }

  function removeById(s, key, id) {
    s[key] = s[key].filter((x) => x.id !== id);
  }

  function applyDirectory(s, r, deleted) {
    if (deleted) return;
    const existing = s.profiles.find((p) => p.id === r.id);
    const patch = {
      id: r.id,
      fullName: r.full_name,
      roles: r.roles,
      className: s.server.classes[r.class_id] || existing?.className || null,
    };
    s.profiles = existing
      ? s.profiles.map((p) => (p.id === r.id ? { ...p, ...patch } : p))
      : [...s.profiles, { code: '', room: null, ...patch }];
  }

  function applyLeave(s, r, deleted) {
    if (deleted) return removeById(s, 'leaveRequests', r.id);
    s.leaveRequests = upsertById(s.leaveRequests, {
      id: r.id,
      studentId: r.student_id,
      kind: r.kind,
      fromDate: isoDate(r.from_at),
      toDate: isoDate(r.to_at),
      reason: r.reason,
      status: r.status,
      reviewedBy: r.reviewed_by,
    });
  }

  function applyMealCut(s, r, deleted) {
    s.mealCuts = s.mealCuts.filter(
      (c) =>
        c.id !== r.id && !(c.studentId === r.student_id && c.date === r.date && c.meal === r.meal),
    );
    if (deleted) return;
    s.mealCuts.push({
      id: r.id,
      studentId: r.student_id,
      date: r.date,
      meal: r.meal,
      source: r.source === 'leave_request' ? 'leave' : 'manual',
      leaveId: r.leave_request_id,
    });
  }

  function applyMenu(s, r, deleted) {
    const day = s.menus.find((m) => m.date === r.date) || {
      date: r.date,
      dayLabel: dayLabel(r.date),
      breakfast: '',
      lunch: '',
      dinner: '',
    };
    const updated = { ...day, [r.meal]: deleted ? '' : (r.dishes || []).join(', ') };
    s.menus = [...s.menus.filter((m) => m.date !== r.date), updated].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  function applyRoomIssue(s, r, deleted) {
    if (deleted) return removeById(s, 'roomReports', r.id);
    s.roomReports = upsertById(s.roomReports, {
      id: r.id,
      room: s.server.rooms[r.room_id] || '',
      reportedBy: r.reported_by,
      category: ISSUE_LABELS[r.category] || r.category,
      description: r.description,
      status: r.status,
      createdAt: shortTime(r.created_at),
    });
  }

  function applyHealth(s, r, deleted) {
    if (deleted) return removeById(s, 'healthReports', r.id);
    const symptoms = (r.symptoms || []).map((x) => SYMPTOM_LABELS[x] || x).join(', ');
    s.healthReports = upsertById(s.healthReports, {
      id: r.id,
      studentId: r.student_id,
      symptoms: r.note ? `${symptoms} — ${r.note}` : symptoms,
      severity: r.temperature ? `${r.temperature}°C` : 'Nhẹ',
      status: HEALTH_STATUS[r.status] || r.status,
      createdAt: shortTime(r.created_at),
    });
  }

  function applySos(s, r, deleted) {
    if (deleted || r.resolved_at) return removeById(s, 'sosAlerts', r.id);
    s.sosAlerts = upsertById(s.sosAlerts, {
      id: r.id,
      studentId: r.student_id,
      time: shortTime(r.created_at),
    });
  }

  function applyGrade(s, r, deleted) {
    const field = GRADE_KIND[r.kind];
    if (!field) return;
    const key = `${r.student_id}|${r.subject}`;
    const existing = s.grades.find((g) => g.serverKey === key);
    const value = deleted ? null : Number(r.score);
    if (existing) {
      s.grades = s.grades.map((g) => (g.serverKey === key ? { ...g, [field]: value } : g));
    } else if (!deleted) {
      s.grades.push({
        id: `gr-${key}`,
        serverKey: key,
        studentId: r.student_id,
        subject: r.subject,
        oral: null,
        quiz15: null,
        midterm: null,
        finalExam: null,
        [field]: value,
      });
    }
  }

  function applyAnnouncement(s, r, deleted) {
    if (deleted) return removeById(s, 'announcements', r.id);
    s.announcements = upsertById(s.announcements, {
      id: r.id,
      className: r.class_id ? s.server.classes[r.class_id] || '' : 'Toàn trường',
      authorId: r.created_by,
      title: r.title,
      body: r.body,
      createdAt: shortTime(r.created_at),
    });
  }

  function applyScholarship(s, r, deleted) {
    if (deleted) return removeById(s, 'scholarships', r.id);
    s.scholarships = upsertById(s.scholarships, {
      id: r.id,
      title: r.title,
      sponsor: r.provider,
      amount: r.amount_text || '',
      deadline: r.deadline || '',
      criteria: r.eligibility,
    });
  }

  function applyCulture(s, r, deleted) {
    if (deleted || r.status === 'rejected') return removeById(s, 'culturePosts', r.id);
    s.culturePosts = upsertById(s.culturePosts, {
      id: r.id,
      authorId: r.author_id,
      ethnicity: r.ethnicity,
      category: r.category,
      title: r.title,
      story: r.body,
      approved: r.status === 'published',
    });
  }

  /**
   * Lần đăng nhập Supabase đầu tiên: bỏ dữ liệu mẫu, chỉ giữ dữ liệu thật từ máy chủ.
   */
  function resetToServerState(s, profile, children) {
    s.server = { cursors: {}, classes: {}, rooms: {} };
    s.profiles = [profile, ...children];
    for (const key of [
      'dormAttendance',
      'leaveRequests',
      'roomReports',
      'menus',
      'mealCuts',
      'mealFeedback',
      'grades',
      'announcements',
      'healthReports',
      'healthChecks',
      'medicalReminders',
      'sosAlerts',
      'donations',
      'itemRequests',
      'scholarships',
      'policyArticles',
      'culturePosts',
    ]) {
      s[key] = [];
    }
    s.savedScholarshipIds = [];
    s.outbox = [];
    if (children[0]) s.session.selectedChildId = children[0].id;
  }

  /**
   * Kéo dữ liệu mới. `mutate` là `store.mutate` để mọi thay đổi đi qua 1 cửa duy nhất.
   */
  async function pull(getState, mutate) {
    const state = getState();
    if (!isEnabled(state.session) || !state.server) return;
    for (let round = 0; round < MAX_PULL_ROUNDS; round += 1) {
      const cursors = {};
      for (const t of PULL_TABLES) cursors[t] = getState().server.cursors[t] || null;
      const data = await apiFetch('/api/v1/sync/pull', getState().session, {
        method: 'POST',
        body: JSON.stringify({ cursors }),
      });
      let more = false;
      mutate((s) => {
        // classes & rooms trước để các bảng khác tra được tên
        for (const t of PULL_TABLES) {
          const page = data.tables[t];
          if (!page) continue;
          applyRows(s, t, page.rows);
          s.server.cursors[t] = page.next_cursor;
          more = more || page.has_more;
        }
      });
      if (!more) return;
    }
  }

  // ---------------------------------------------------------------- Outbox -> lệnh backend
  const ISSUE_CATEGORY = [
    [/điện|đèn/i, 'electric'],
    [/nước|vòi/i, 'water'],
    [/cửa/i, 'door_window'],
    [/giường|tủ/i, 'bed'],
  ];
  const SYMPTOM_WORDS = [
    [/sốt/i, 'fever'],
    [/đầu/i, 'headache'],
    [/bụng/i, 'stomachache'],
    [/ho/i, 'cough'],
    [/chóng mặt/i, 'dizzy'],
    [/họng/i, 'sore_throat'],
    [/nôn/i, 'vomit'],
    [/thương|ngã/i, 'injury'],
  ];

  function pickCategory(text, table, fallback) {
    const hit = table.find(([re]) => re.test(text || ''));
    return hit ? hit[1] : fallback;
  }

  function roomIdByName(state, name) {
    const entry = Object.entries(state.server?.rooms || {}).find(([, n]) => n === name);
    return entry ? entry[0] : null;
  }

  /**
   * Trả về `{ command, payload }` để gửi lên, hoặc `null` nếu lệnh chỉ dùng cục bộ.
   */
  function toServerOp(op, state) {
    const p = op.payload || {};
    const me = state.session.userId;
    switch (op.command) {
      case 'leave_request.create':
        return {
          command: 'leave_request.create',
          payload: {
            id: p.id,
            student_id: p.student_id,
            kind: p.kind || 'go_home',
            from_at: `${p.from_date}T07:00:00${VN_OFFSET}`,
            to_at: `${p.to_date}T17:00:00${VN_OFFSET}`,
            reason: p.reason,
          },
        };
      case 'leave_request.review':
        return { command: 'leave_request.review', payload: { id: p.id, status: p.status } };
      case 'room_issue.create': {
        const roomId = roomIdByName(state, p.room);
        if (!roomId) return null;
        return {
          command: 'room_issue.create',
          payload: {
            id: p.id,
            room_id: roomId,
            category: pickCategory(p.category, ISSUE_CATEGORY, 'other'),
            description: p.description,
          },
        };
      }
      case 'room_issue.resolve':
        return { command: 'room_issue.update_status', payload: { id: p.id, status: 'resolved' } };
      case 'meal_cancellation.toggle':
        return p.cancelled
          ? {
              command: 'meal.cancel',
              payload: { id: p.id, student_id: p.student_id || me, date: p.date, meal: p.meal },
            }
          : {
              command: 'meal.uncancel',
              payload: { student_id: p.student_id || me, date: p.date, meal: p.meal },
            };
      case 'health_report.create': {
        const symptoms = SYMPTOM_WORDS.filter(([re]) => re.test(p.symptoms || '')).map(
          ([, v]) => v,
        );
        return {
          command: 'health_report.create',
          payload: {
            id: p.id,
            symptoms: symptoms.length ? symptoms : ['other'],
            note: [p.symptoms, p.severity].filter(Boolean).join(' · ').slice(0, 1000),
          },
        };
      }
      case 'sos.trigger':
        return { command: 'sos.raise', payload: { id: p.id, client_at: op.client_at } };
      case 'meal_feedback.create':
        return p.dish_suggestion && p.dish_suggestion.length >= 2
          ? {
              command: 'dish.suggest',
              payload: {
                id: p.id,
                name: p.dish_suggestion.slice(0, 120),
                description: p.note ? p.note.slice(0, 1000) : null,
              },
            }
          : null;
      default:
        return null; // dorm_checkin.record cần phiên điểm danh + mã QR ký số của máy chủ
    }
  }

  /**
   * Gửi Outbox. Trả về danh sách op_id đã xong (applied / rejected / chỉ-cục-bộ) để xóa khỏi hàng đợi.
   */
  async function push(state) {
    const done = [];
    const ops = [];
    const rejected = [];
    for (const op of state.outbox) {
      const mapped = UUID_RE.test(op.op_id) ? toServerOp(op, state) : null;
      if (!mapped || (mapped.payload.id && !UUID_RE.test(mapped.payload.id))) {
        done.push(op.op_id);
      } else {
        ops.push({ op_id: op.op_id, client_at: op.client_at, ...mapped });
      }
    }
    if (ops.length) {
      const data = await apiFetch('/api/v1/sync/push', state.session, {
        method: 'POST',
        body: JSON.stringify({ ops: ops.slice(0, 100) }),
      });
      for (const r of data.results || []) {
        if (r.status === 'retry') continue;
        done.push(r.op_id);
        if (r.status === 'rejected') rejected.push(r);
      }
    }
    return { done, rejected };
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.serverSync = {
    isEnabled,
    loadMe,
    pull,
    push,
    toServerOp,
    resetToServerState,
  };
})(window);
