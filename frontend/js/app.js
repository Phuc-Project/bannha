/**
 * BẢN NHÀ — Bộ điều phối trung tâm
 * Router (hash), View Transitions, chế độ Dùng thử, hiệu ứng cuộn/spotlight & ủy quyền sự kiện.
 */
(function initApp(global) {
  const IS_FILE = global.location.protocol === 'file:';
  const { store, authAdapter, aiTutorApi, shell, authViews, dashboards, landing } = global.BanNha;
  const { modulesLife, modulesStudyHealth, modulesCommunityAdmin, styleguide } = global.BanNha;
  const { renderQrSvg, makeQrToken } = global.BanNha.utils;
  const REDUCED_MOTION = global.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let loginPrefillCode = 'HS10A02';
  let authError = '';
  let lastRenderedRoute = null;
  let enteringTimer = null;
  let revealObserver = null;

  function showToast(message) {
    if (!message) return;
    const region = document.getElementById('toast-region');
    if (!region) return;
    const item = document.createElement('div');
    item.className = 'toast-item';
    item.textContent = message;
    const bar = document.createElement('span');
    bar.className = 'toast-progress';
    item.appendChild(bar);
    region.appendChild(item);
    global.setTimeout(() => item.classList.add('is-leaving'), 2950);
    global.setTimeout(() => item.remove(), 3150);
  }

  function currentRoute() {
    const h = global.location.hash.replace(/^#/, '');
    if (h.startsWith('/')) return h;
    return '/';
  }

  function updateLocationRoute(route, replace = false) {
    const target = `#${route}`;
    if (global.location.hash !== target) {
      if (replace) global.history.replaceState({}, '', target);
      else global.history.pushState({}, '', target);
    }
  }

  function hydrateDynamicWidgets() {
    document.querySelectorAll('[data-qr]').forEach((el) => {
      const tok = el.getAttribute('data-qr') || '';
      el.innerHTML = renderQrSvg(tok);
    });

    // Đếm số mượt cho ô thống kê — chỉ khi vừa đổi màn, tôn trọng giảm chuyển động
    if (REDUCED_MOTION || !document.getElementById('app')?.hasAttribute('data-entering')) return;
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = Number(el.getAttribute('data-count') || '0');
      if (!Number.isFinite(target) || target <= 0) return;
      const start = performance.now();
      const dur = 520;
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) global.requestAnimationFrame(step);
      };
      global.requestAnimationFrame(step);
    });
  }

  /** Hiện dần các khối `.reveal` khi cuộn tới (IntersectionObserver) */
  function observeReveals() {
    const nodes = document.querySelectorAll('.reveal:not(.is-in)');
    if (!nodes.length) return;
    if (REDUCED_MOTION || typeof global.IntersectionObserver !== 'function') {
      nodes.forEach((n) => n.classList.add('is-in'));
      return;
    }
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new global.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    nodes.forEach((n) => revealObserver.observe(n));
  }

  function markEntering(appEl) {
    appEl.setAttribute('data-entering', '');
    if (enteringTimer) global.clearTimeout(enteringTimer);
    enteringTimer = global.setTimeout(() => appEl.removeAttribute('data-entering'), 900);
  }

  function renderApp(withTransition = false) {
    const appEl = document.getElementById('app');
    if (!appEl) return;
    const state = store.getState();

    if (state.session.textSize === 'large') {
      document.documentElement.setAttribute('data-text-size', 'large');
    } else {
      document.documentElement.removeAttribute('data-text-size');
    }

    let route = currentRoute();
    const user = store.getCurrentUser();

    let html = '';
    const isGuest = Boolean(state.session.guest);
    if (route === '/dev/ui') {
      html = styleguide.renderStyleguideView(state);
    } else if (route === '/dang-nhap') {
      html = authViews.renderLoginView(state, loginPrefillCode, authError);
    } else if (!user) {
      // Chưa đăng nhập → trang giới thiệu + cổng Dùng thử
      route = '/';
      updateLocationRoute('/', true);
      html = landing.renderLandingView(state);
    } else if (!isGuest && user.mustChangePassword) {
      route = '/doi-mat-khau';
      updateLocationRoute('/doi-mat-khau', true);
      html = authViews.renderChangePasswordView(user, authError);
    } else if (!state.session.activeRole || route === '/chon-vai-tro') {
      route = '/chon-vai-tro';
      updateLocationRoute('/chon-vai-tro', true);
      html = authViews.renderRolePickerView(user);
    } else {
      let inner = '';
      if (route === '/dorm') inner = modulesLife.renderDormView(state);
      else if (route === '/kitchen') inner = modulesLife.renderKitchenView(state);
      else if (route === '/contact') inner = modulesStudyHealth.renderContactBookView(state);
      else if (route === '/tutor') inner = modulesStudyHealth.renderTutorView(state);
      else if (route === '/health') inner = modulesStudyHealth.renderHealthView(state);
      else if (route === '/donations') inner = modulesCommunityAdmin.renderDonationsView(state);
      else if (route === '/scholarships')
        inner = modulesCommunityAdmin.renderScholarshipsView(state);
      else if (route === '/culture') inner = modulesCommunityAdmin.renderCultureView(state);
      else if (route === '/admin') inner = modulesCommunityAdmin.renderAdminView(state);
      else {
        route = '/';
        inner = dashboards.renderDashboard(state);
      }
      html = shell.wrapShell(state, route, inner);
    }

    const routeKey = `${user ? 'u' : 'g'}:${route}`;
    const isNewScreen = routeKey !== lastRenderedRoute;
    lastRenderedRoute = routeKey;

    const commitDom = () => {
      if (isNewScreen) markEntering(appEl);
      appEl.innerHTML = html;
      hydrateDynamicWidgets();
      observeReveals();
      syncScrollState();
    };

    if (withTransition && typeof document.startViewTransition === 'function') {
      document.startViewTransition(commitDom);
    } else {
      commitDom();
    }
  }

  function navigateTo(path) {
    authError = '';
    updateLocationRoute(path);
    renderApp(true);
    global.scrollTo({ top: 0, behavior: 'instant' });
  }

  /**
   * Đăng nhập Supabase thật: lấy hồ sơ từ /api/v1/me, thay dữ liệu mẫu bằng dữ liệu máy chủ.
   */
  async function completeServerLogin(res) {
    const session = { accessToken: res.accessToken, authProvider: 'supabase', activeRole: null };
    try {
      const { profile, children } = await global.BanNha.serverSync.loadMe(session);
      await store.mutateAndFlushIdb((s) => {
        global.BanNha.serverSync.resetToServerState(s, profile, children);
        s.session.userId = profile.id;
        s.session.guest = false;
        s.session.accessToken = res.accessToken;
        s.session.authProvider = 'supabase';
        s.session.activeRole = profile.roles.length === 1 ? profile.roles[0] : null;
        s.session.textSize = profile.roles.includes('parent') ? 'large' : 'normal';
      });
      return true;
    } catch (error) {
      authError =
        error?.status === 401 || error?.status === 403
          ? 'Tài khoản chưa được nhà trường kích hoạt hồ sơ.'
          : `Không tải được hồ sơ từ máy chủ: ${error?.message || 'lỗi mạng'}`;
      renderApp(false);
      return false;
    }
  }

  async function handleFormSubmit(form, submitter) {
    const kind = form.getAttribute('data-form');
    const fd = new FormData(form);
    const state = store.getState();
    const user = store.getCurrentUser();

    if (kind === 'login') {
      const code = String(fd.get('code') || '').trim();
      const password = String(fd.get('password') || '');
      const provider = authAdapter.getActiveProvider();
      const res = await provider.signIn(code, password, state.profiles);
      if (!res.ok) {
        authError = res.error;
        loginPrefillCode = code;
        renderApp(false);
        return;
      }
      authError = '';
      if (res.provider === 'supabase' && global.BanNha.serverSync.isEnabled({
        accessToken: res.accessToken,
        authProvider: 'supabase',
      })) {
        const ok = await completeServerLogin(res);
        if (!ok) return;
        const serverUser = store.getCurrentUser();
        if (serverUser.mustChangePassword) navigateTo('/doi-mat-khau');
        else if (serverUser.roles.length > 1) navigateTo('/chon-vai-tro');
        else navigateTo('/');
        void store.flushOutbox();
        return;
      }
      await store.mutateAndFlushIdb((s) => {
        let profile = s.profiles.find((p) => p.code.toUpperCase() === res.code.toUpperCase());
        if (!profile) {
          profile = {
            id: res.uid || store.helpers.uid('usr'),
            code: res.code,
            fullName: res.code,
            roles: ['student'],
            className: '10A1',
            room: 'A201',
            ethnicity: 'Tày',
            mustChangePassword: false,
          };
          s.profiles.push(profile);
        }
        s.session.userId = profile.id;
        s.session.guest = false;
        s.session.accessToken = res.accessToken;
        s.session.authProvider = res.provider;
        s.session.activeRole = profile.roles.length === 1 ? profile.roles[0] : null;
        s.session.textSize = profile.roles.includes('parent') ? 'large' : 'normal';
      });
      const loggedIn = store.getCurrentUser();
      if (loggedIn.mustChangePassword) navigateTo('/doi-mat-khau');
      else if (loggedIn.roles.length > 1) navigateTo('/chon-vai-tro');
      else navigateTo('/');
      return;
    }

    if (kind === 'change-password') {
      const curPw = String(fd.get('currentPassword') || '');
      const newPw = String(fd.get('newPassword') || '');
      const res = await authAdapter
        .getActiveProvider()
        .changePassword(state.session.accessToken, curPw, newPw);
      if (!res.ok) {
        authError = res.error;
        renderApp(false);
        return;
      }
      authError = '';
      await store.mutateAndFlushIdb((s) => {
        const p = s.profiles.find((x) => x.id === s.session.userId);
        if (p) {
          p.mustChangePassword = false;
          p.customPassword = newPw;
        }
      });
      showToast('Đã cập nhật mật khẩu mới an toàn.');
      navigateTo('/');
      return;
    }

    if (kind === 'manual-qr-scan') {
      handleQrScan(String(fd.get('token') || ''));
      return;
    }

    if (kind === 'create-leave') {
      const fromDate = String(fd.get('fromDate') || '');
      const toDate = String(fd.get('toDate') || '');
      const reason = String(fd.get('reason') || '').trim();
      const studentId = String(fd.get('studentId') || user.id);
      const id = store.helpers.uid('lv');
      store.mutate((s) => {
        s.leaveRequests.unshift({
          id,
          studentId,
          kind: 'go_home',
          fromDate,
          toDate,
          reason,
          status: 'pending',
          reviewedBy: null,
        });
        store.enqueueOp('leave_request.create', {
          id,
          student_id: studentId,
          kind: 'go_home',
          from_date: fromDate,
          to_date: toDate,
          reason,
        });
      });
      showToast(
        state.online
          ? 'Đã gửi đơn xin phép về bản tới thầy cô Quản sinh.'
          : 'Đơn đã lưu vào máy, sẽ tự gửi khi có sóng.',
      );
      renderApp(false);
      return;
    }

    if (kind === 'create-room-issue') {
      const category = String(fd.get('category') || '');
      const description = String(fd.get('description') || '').trim();
      const roomIssueId = store.helpers.uid('rm');
      store.mutate((s) => {
        s.roomReports.unshift({
          id: roomIssueId,
          room: user?.room || 'A201',
          reportedBy: user?.id || 'stu-01',
          category,
          description,
          status: 'open',
          createdAt: 'Vừa xong',
        });
        store.enqueueOp('room_issue.create', {
          id: roomIssueId,
          room: user?.room || '',
          category,
          description,
        });
      });
      showToast('Đã ghi nhận báo hỏng phòng ở.');
      renderApp(false);
      return;
    }

    if (kind === 'meal-feedback') {
      const feedback = {
        id: store.helpers.uid('fb'),
        studentId: user?.id || 'stu-01',
        dishSuggestion: String(fd.get('dishSuggestion') || '').trim(),
        rating: 5,
        note: String(fd.get('note') || '').trim(),
      };
      store.mutate((s) => {
        s.mealFeedback.unshift(feedback);
        store.enqueueOp('meal_feedback.create', {
          id: feedback.id,
          dish_suggestion: feedback.dishSuggestion,
          note: feedback.note,
        });
      });
      showToast('Cảm ơn em đã gửi góp ý cho Nhà bếp!');
      renderApp(false);
      return;
    }

    if (kind === 'add-grade') {
      store.mutate((s) => {
        s.grades.push({
          id: store.helpers.uid('gr'),
          studentId: 'stu-01',
          subject: String(fd.get('subject') || ''),
          oral: 8,
          quiz15: 8,
          midterm: 8,
          finalExam: Number(fd.get('finalExam') || 8),
        });
      });
      showToast('Đã lưu điểm mới và cập nhật Sổ liên lạc.');
      renderApp(false);
      return;
    }

    if (kind === 'create-announcement') {
      store.mutate((s) => {
        s.announcements.unshift({
          id: store.helpers.uid('an'),
          className: '10A1',
          authorId: user?.id || 'tch-01',
          title: String(fd.get('title') || ''),
          body: String(fd.get('body') || ''),
          createdAt: 'Vừa xong',
        });
      });
      showToast('Đã phát thông báo tới Phụ huynh.');
      renderApp(false);
      return;
    }

    if (kind === 'ask-tutor') {
      const question = String(fd.get('question') || '').trim();
      if (!question) return;
      const activeTopic =
        state.lessonTopics.find((tp) => tp.id === state.tutorState.topicId) ||
        state.lessonTopics[0];
      const currentAttempt = state.tutorState.attemptCount;
      const replyObj = await aiTutorApi.askTutor({
        subject: state.tutorState.subject,
        topicTitle: activeTopic?.title,
        action: 'ask',
        question,
        attemptCount: currentAttempt,
        history: state.tutorState.messages,
        accessToken: state.session.accessToken,
        online: state.online,
      });
      store.mutate((s) => {
        s.tutorState.messages.push(
          { id: store.helpers.uid('tm'), sender: 'student', text: question },
          {
            id: store.helpers.uid('tm'),
            sender: 'tutor',
            text: replyObj.reply,
            mode: replyObj.step,
          },
        );
        s.tutorState.attemptCount += 1;
        s.tutorState.usedToday += 1;
      });
      renderApp(false);
      return;
    }

    if (kind === 'report-sick') {
      const report = {
        id: store.helpers.uid('hr'),
        studentId: user?.id || 'stu-01',
        symptoms: String(fd.get('symptoms') || ''),
        severity: String(fd.get('severity') || 'Nhẹ'),
        status: 'Phòng Y tế đã tiếp nhận',
        createdAt: 'Vừa xong',
      };
      store.mutate((s) => {
        s.healthReports.unshift(report);
        store.enqueueOp('health_report.create', {
          id: report.id,
          symptoms: report.symptoms,
          severity: report.severity,
        });
      });
      showToast('Đã gửi báo ốm tới cán bộ Y tế trường.');
      renderApp(false);
      return;
    }

    if (kind === 'create-donation') {
      store.mutate((s) => {
        s.donations.unshift({
          id: store.helpers.uid('dn'),
          donorId: user?.id || 'stu-01',
          category: String(fd.get('category') || 'winter_coat'),
          sizeOrGrade: String(fd.get('sizeOrGrade') || 'Size M'),
          title: String(fd.get('title') || ''),
          status: 'available',
        });
      });
      showToast('Đã đăng món đồ tặng lên Ngân hàng đồ cũ.');
      renderApp(false);
      return;
    }

    if (kind === 'create-item-request') {
      store.mutate((s) => {
        s.itemRequests.unshift({
          id: store.helpers.uid('rq'),
          studentId: user?.id || 'stu-01',
          category: String(fd.get('category') || 'winter_coat'),
          sizeOrGrade: String(fd.get('sizeOrGrade') || 'Size M'),
          urgency: 'high',
          note: String(fd.get('note') || ''),
          status: 'open',
        });
      });
      showToast('Đã gửi đăng ký kín đáo tới thầy cô Quản sinh.');
      renderApp(false);
      return;
    }

    if (kind === 'submit-riasec') {
      const scores = {
        R: fd.get('R'),
        I: fd.get('I'),
        A: fd.get('A'),
        S: fd.get('S'),
        E: fd.get('E'),
        C: fd.get('C'),
      };
      store.mutate((s) => {
        s.careerResult = store.helpers.scoreRiasec(scores);
      });
      showToast('Đã phân tích xong tổ hợp nghề nghiệp Holland!');
      renderApp(false);
      return;
    }

    if (kind === 'create-culture-post') {
      store.mutate((s) => {
        s.culturePosts.unshift({
          id: store.helpers.uid('cu'),
          authorId: user?.id || 'stu-01',
          ethnicity: String(fd.get('ethnicity') || 'Mông'),
          category: String(fd.get('category') || 'Lễ hội truyền thống'),
          title: String(fd.get('title') || ''),
          story: String(fd.get('story') || ''),
          approved: false,
        });
      });
      showToast('Bài viết đã gửi chờ Thầy/Cô duyệt đăng.');
      renderApp(false);
      return;
    }

    if (kind === 'csv-import') {
      const mode = submitter?.value || 'dry-run';
      const lines = String(fd.get('csvText') || '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const validRows = [];
      let errorCount = 0;
      for (const line of lines) {
        const cols = line.split(',').map((c) => c.trim());
        if (cols.length >= 3 && cols[0] && cols[1]) validRows.push(cols);
        else errorCount += 1;
      }
      store.mutate((s) => {
        s.ui.csvPreview = { validCount: validRows.length, errorCount };
        if (mode === 'commit') {
          for (const [code, fullName, role, className, room, ethnicity] of validRows) {
            if (!s.profiles.some((p) => p.code.toUpperCase() === code.toUpperCase())) {
              s.profiles.push({
                id: store.helpers.uid('stu'),
                code: code.toUpperCase(),
                fullName,
                roles: [role || 'student'],
                className: className || '10A1',
                room: room || 'A201',
                ethnicity: ethnicity || 'Mông',
                mustChangePassword: true,
                qrToken: makeQrToken(global.BanNha.CONFIG.schoolId, code.toUpperCase(), 1),
              });
            }
          }
        }
      });
      showToast(
        mode === 'commit'
          ? `Đã tạo thành công ${validRows.length} tài khoản mới.`
          : `Kiểm tra thử hoàn tất: ${validRows.length} dòng hợp lệ.`,
      );
      renderApp(false);
    }
  }

  function handleQrScan(token) {
    const check = store.helpers.verifyQrToken(token, global.BanNha.CONFIG.schoolId);
    if (!check.ok) {
      showToast(check.reason);
      return;
    }
    const today = store.helpers.vnTodayIso();
    let matchedName = '';
    store.mutate((s) => {
      const student = s.profiles.find((p) => p.code === check.studentCode);
      if (!student) return;
      matchedName = student.fullName;
      s.ui.lastScannedName = student.fullName;
      if (!s.dormAttendance.some((a) => a.studentId === student.id && a.date === today)) {
        s.dormAttendance.unshift({
          id: store.helpers.uid('att'),
          studentId: student.id,
          date: today,
          time: '20:55',
          method: 'qr',
        });
        store.enqueueOp('dorm_checkin.record', { student_code: student.code, date: today });
      }
    });
    if (matchedName) {
      showToast(`Đã điểm danh: ${matchedName}`);
      renderApp(false);
    }
  }

  async function handleActionClick(btn) {
    const act = btn.getAttribute('data-action');
    const state = store.getState();

    if (act === 'prefill-login') {
      loginPrefillCode = btn.getAttribute('data-code') || 'HS10A02';
      authError = '';
      renderApp(false);
      return;
    }
    if (act === 'start-trial') {
      const role = btn.getAttribute('data-role') || 'student';
      const goto = btn.getAttribute('data-goto') || '/';
      authError = '';
      store.startTrial(role);
      navigateTo(goto);
      const label = landing.TRIAL_ROLES.find((r) => r.role === role)?.title || 'Học sinh';
      showToast(`Đang dùng thử với vai ${label}. Bạn có thể đổi vai trên thanh vàng phía trên.`);
      return;
    }
    if (act === 'exit-trial') {
      await store.logoutAndWipe();
      navigateTo('/');
      showToast('Đã thoát bản dùng thử, mọi dữ liệu thử đã được xóa.');
      return;
    }
    if (act === 'scroll-to') {
      const targetId = btn.getAttribute('data-target') || 'top';
      const el = document.getElementById(targetId);
      if (targetId === 'top' || !el) {
        global.scrollTo({ top: 0, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
      } else {
        el.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'start' });
      }
      return;
    }
    if (act === 'pick-role') {
      const role = btn.getAttribute('data-role') || 'teacher';
      store.mutate((s) => {
        s.session.activeRole = role;
        s.session.textSize = role === 'parent' ? 'large' : 'normal';
      });
      navigateTo('/');
      void store.flushOutbox();
      return;
    }
    if (act === 'logout') {
      await store.logoutAndWipe();
      loginPrefillCode = 'HS10A02';
      navigateTo('/dang-nhap');
      showToast('Đã đăng xuất và xóa sạch dữ liệu tạm trên thiết bị.');
      return;
    }
    if (act === 'toggle-online') {
      store.mutate((s) => {
        s.online = !s.online;
      });
      if (store.getState().online) {
        await store.flushOutbox();
        showToast('Đã có mạng trở lại — tự động đồng bộ hàng đợi!');
      } else {
        showToast('Đang mô phỏng chế độ mất sóng ngoại tuyến.');
      }
      renderApp(false);
      return;
    }
    if (act === 'toggle-text-size') {
      store.mutate((s) => {
        s.session.textSize = s.session.textSize === 'large' ? 'normal' : 'large';
      });
      renderApp(false);
      return;
    }
    if (act === 'switch-tab') {
      const mod = btn.getAttribute('data-module');
      const tab = btn.getAttribute('data-tab');
      store.mutate((s) => {
        if (mod && tab) s.ui.activeTabs[mod] = tab;
      });
      renderApp(true);
      return;
    }
    if (act === 'select-child') {
      store.mutate((s) => {
        s.session.selectedChildId = btn.getAttribute('data-child-id') || 'stu-01';
      });
      renderApp(true);
      return;
    }
    if (act === 'scan-qr') {
      handleQrScan(btn.getAttribute('data-token') || '');
      return;
    }
    if (act === 'review-leave') {
      const id = btn.getAttribute('data-id');
      const status = btn.getAttribute('data-status');
      let cutCount = 0;
      store.mutate((s) => {
        const lv = s.leaveRequests.find((x) => x.id === id);
        if (!lv) return;
        lv.status = status;
        lv.reviewedBy = s.session.userId;
        cutCount = store.syncLeaveMealCuts(lv);
        store.enqueueOp('leave_request.review', { id, status });
      });
      showToast(
        status === 'approved'
          ? `Đã duyệt đơn và tự động báo cắt suất bếp (${cutCount} bữa).`
          : 'Đã cập nhật từ chối đơn xin phép.',
      );
      renderApp(false);
      return;
    }
    if (act === 'resolve-room') {
      const id = btn.getAttribute('data-id');
      store.mutate((s) => {
        const r = s.roomReports.find((x) => x.id === id);
        if (r) r.status = 'resolved';
        store.enqueueOp('room_issue.resolve', { id });
      });
      showToast('Đã đánh dấu hoàn thành sửa chữa phòng ở.');
      renderApp(false);
      return;
    }
    if (act === 'toggle-meal-cut') {
      const date = btn.getAttribute('data-date') || '';
      const meal = btn.getAttribute('data-meal') || 'dinner';
      const userId = store.getCurrentUser()?.id || 'stu-01';
      store.mutate((s) => {
        const idx = s.mealCuts.findIndex(
          (c) => c.studentId === userId && c.date === date && c.meal === meal,
        );
        const cutId = store.helpers.uid('mc');
        if (idx >= 0) s.mealCuts.splice(idx, 1);
        else
          s.mealCuts.push({
            id: cutId,
            studentId: userId,
            date,
            meal,
            source: 'manual',
            leaveId: null,
          });
        store.enqueueOp('meal_cancellation.toggle', {
          id: cutId,
          student_id: userId,
          date,
          meal,
          cancelled: idx < 0,
        });
      });
      showToast('Đã cập nhật báo suất ăn với Nhà bếp.');
      renderApp(false);
      return;
    }
    if (act === 'unlock-tutor-solution') {
      const lastStudentMsg =
        [...state.tutorState.messages].reverse().find((m) => m.sender === 'student')?.text ||
        'Bài tập đang làm';
      const replyObj = await aiTutorApi.askTutor({
        subject: state.tutorState.subject,
        topicTitle: '',
        action: 'solution',
        question: lastStudentMsg,
        attemptCount: state.tutorState.attemptCount,
        history: state.tutorState.messages,
        accessToken: state.session.accessToken,
        online: state.online,
      });
      store.mutate((s) => {
        s.tutorState.messages.push({
          id: store.helpers.uid('tm'),
          sender: 'tutor',
          text: replyObj.reply,
          mode: 'solution',
        });
      });
      renderApp(false);
      return;
    }
    if (act === 'generate-quiz') {
      const topicId = btn.getAttribute('data-topic-id');
      const topic = state.lessonTopics.find((tp) => tp.id === topicId) || state.lessonTopics[0];
      store.mutate((s) => {
        s.ui.activePracticeQuiz = aiTutorApi.buildPracticeQuiz(topic);
      });
      showToast('Đã tạo bộ 5 câu tự luyện theo bài trên lớp!');
      renderApp(false);
      return;
    }
    if (act === 'confirm-donation-match') {
      const offerId = btn.getAttribute('data-offer-id');
      const reqId = btn.getAttribute('data-req-id');
      store.mutate((s) => {
        const off = s.donations.find((o) => o.id === offerId);
        const req = s.itemRequests.find((r) => r.id === reqId);
        if (off) off.status = 'matched';
        if (req) req.status = 'fulfilled';
      });
      showToast('Đã xác nhận trao tận tay món đồ cho học sinh.');
      renderApp(false);
      return;
    }
    if (act === 'toggle-save-scholarship') {
      const id = btn.getAttribute('data-id');
      store.mutate((s) => {
        const i = s.savedScholarshipIds.indexOf(id);
        if (i >= 0) s.savedScholarshipIds.splice(i, 1);
        else s.savedScholarshipIds.push(id);
      });
      showToast('Đã cập nhật danh sách nhắc hạn học bổng.');
      renderApp(false);
      return;
    }
    if (act === 'approve-culture') {
      const id = btn.getAttribute('data-id');
      store.mutate((s) => {
        const post = s.culturePosts.find((c) => c.id === id);
        if (post) post.approved = true;
      });
      showToast('Đã duyệt đăng câu chuyện văn hóa lên bảng tin trường.');
      renderApp(false);
      return;
    }
    if (act === 'print-a4') {
      global.print();
    }
  }

  function bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('[data-nav]');
      if (navBtn) {
        e.preventDefault();
        navigateTo(navBtn.getAttribute('data-nav') || '/');
        return;
      }
      const actBtn = e.target.closest('[data-action]');
      if (actBtn && !actBtn.disabled) {
        e.preventDefault();
        void handleActionClick(actBtn);
      }
    });

    document.addEventListener('submit', (e) => {
      const form = e.target.closest('[data-form]');
      if (!form) return;
      e.preventDefault();
      void handleFormSubmit(form, e.submitter);
    });

    document.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-change="trial-role"]');
      if (!sel) return;
      store.switchTrialRole(sel.value);
      navigateTo('/');
      const label = landing.TRIAL_ROLES.find((r) => r.role === sel.value)?.title || sel.value;
      showToast(`Đã chuyển sang vai ${label}.`);
    });

    // Vệt sáng theo con trỏ trên thẻ (chỉ thiết bị có chuột, gom theo khung hình)
    if (global.matchMedia?.('(hover: hover) and (pointer: fine)').matches && !REDUCED_MOTION) {
      let spotTarget = null;
      let spotX = 0;
      let spotY = 0;
      let spotQueued = false;
      document.addEventListener(
        'pointermove',
        (e) => {
          const el = e.target.closest?.('.card-interactive, .spot');
          if (!el) return;
          spotTarget = el;
          spotX = e.clientX;
          spotY = e.clientY;
          if (spotQueued) return;
          spotQueued = true;
          global.requestAnimationFrame(() => {
            spotQueued = false;
            if (!spotTarget) return;
            const r = spotTarget.getBoundingClientRect();
            spotTarget.style.setProperty('--mx', `${spotX - r.left}px`);
            spotTarget.style.setProperty('--my', `${spotY - r.top}px`);
          });
        },
        { passive: true },
      );
    }

    // Đổ bóng header khi cuộn + parallax rất nhẹ cho dãy núi
    let scrollQueued = false;
    global.addEventListener(
      'scroll',
      () => {
        if (scrollQueued) return;
        scrollQueued = true;
        global.requestAnimationFrame(() => {
          scrollQueued = false;
          syncScrollState();
        });
      },
      { passive: true },
    );

    // GPU-composited 2-second SOS Hold Guard (`transform: scaleX(...)` only, zero layout reflow)
    let holdTimer = null;
    let holdRaf = null;
    let holdStart = 0;

    const resetHold = (btn) => {
      if (holdTimer) global.clearTimeout(holdTimer);
      if (holdRaf) global.cancelAnimationFrame(holdRaf);
      holdTimer = null;
      holdRaf = null;
      if (btn) {
        btn.removeAttribute('data-holding');
        const fill = btn.querySelector('.hold-fill');
        if (fill) fill.style.transform = 'scaleX(0)';
      }
    };

    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('[data-hold-sos]');
      if (!btn) return;
      const duration = Number(btn.getAttribute('data-hold-sos') || '2000');
      btn.setAttribute('data-holding', 'true');
      holdStart = performance.now();
      const fill = btn.querySelector('.hold-fill');

      const tick = (now) => {
        const ratio = Math.min(1, (now - holdStart) / duration);
        if (fill) fill.style.transform = `scaleX(${ratio.toFixed(3)})`;
        if (ratio < 1) holdRaf = global.requestAnimationFrame(tick);
      };
      holdRaf = global.requestAnimationFrame(tick);

      holdTimer = global.setTimeout(() => {
        resetHold(btn);
        store.mutate((s) => {
          const sosId = store.helpers.uid('sos');
          s.sosAlerts.unshift({
            id: sosId,
            studentId: store.getCurrentUser()?.id || 'stu-01',
            time: '21:10',
          });
          store.enqueueOp('sos.trigger', { id: sosId });
        });
        showToast('ĐÃ PHÁT TÍN HIỆU SOS KHẨN CẤP! Thầy cô Quản sinh & Y tế đã nhận báo động.');
        renderApp(false);
      }, duration);

      const stop = () => {
        resetHold(btn);
        global.removeEventListener('pointerup', stop);
        global.removeEventListener('pointercancel', stop);
      };
      global.addEventListener('pointerup', stop, { once: true });
      global.addEventListener('pointercancel', stop, { once: true });
    });

    global.addEventListener('popstate', () => renderApp(true));
    global.addEventListener('hashchange', () => renderApp(true));
    global.addEventListener('online', () => {
      store.mutate((s) => {
        s.online = true;
      });
      void store.flushOutbox();
      renderApp(false);
    });
    global.addEventListener('offline', () => {
      store.mutate((s) => {
        s.online = false;
      });
      renderApp(false);
    });
  }

  function syncScrollState() {
    const y = global.scrollY || 0;
    document.querySelectorAll('[data-scroll-header]').forEach((h) => {
      h.setAttribute('data-scrolled', y > 8 ? 'true' : 'false');
    });
    if (!REDUCED_MOTION) {
      document.documentElement.style.setProperty('--sy', String(Math.min(y, 1200)));
    }
    const header = document.querySelector('.app-header');
    if (header) {
      document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
    }
  }

  async function start() {
    document.documentElement.classList.add('js-ready');
    await store.hydrateFromIdb();
    bindGlobalEvents();
    renderApp(false);
    if (!IS_FILE && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => undefined);
    }
  }

  void start();
})(window);
