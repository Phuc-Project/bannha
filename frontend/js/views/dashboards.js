/**
 * BẢN NHÀ — Trang chủ theo vai trò (Khoa học, hành động trực tiếp)
 */
(function initDashboards(global) {
  const { esc } = global.BanNha.utils;
  const { calcWeightedAverage } = global.BanNha.domain;
  const { icon } = global.BanNha.icons;

  function renderStudentHome(state, user) {
    const today = global.BanNha.store.helpers.vnTodayIso();
    const checkedIn = state.dormAttendance.some((a) => a.studentId === user.id && a.date === today);
    const todayMenu = state.menus[0];
    const remainingAi = Math.max(0, global.BanNha.CONFIG.aiTutor.dailyLimit - state.tutorState.usedToday);
    const latestNotice = state.announcements[0];
    const nextReminder = state.medicalReminders[0];

    const quickLinks = [
      { path: '/contact', title: 'Sổ liên lạc', desc: 'Xem bảng điểm & thông báo lớp', icon: 'contact', tone: 'tone-sky' },
      { path: '/donations', title: 'Ngân hàng đồ cũ', desc: 'Đăng ký nhận hoặc tặng áo ấm, sách', icon: 'donations', tone: 'tone-teal' },
      { path: '/scholarships', title: 'Học bổng & Nghề', desc: `${state.savedScholarshipIds.length} học bổng đang lưu nhắc hạn`, icon: 'scholarships', tone: 'tone-sky' },
      { path: '/culture', title: 'Kho văn hóa', desc: 'Đọc và chia sẻ câu chuyện bản làng', icon: 'culture', tone: 'tone-amber' },
    ];

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Chào em, ${esc(user.fullName)}</h1>
            <p class="text-muted">
              Lớp ${esc(user.className || '—')} · Phòng ${esc(user.room || '—')}${user.ethnicity ? ` · Dân tộc ${esc(user.ethnicity)}` : ''}
            </p>
          </div>
          <span class="chip ${checkedIn ? 'chip-success' : 'chip-amber'}">
            ${checkedIn ? 'Đã điểm danh tối nay' : 'Chưa điểm danh tối 20:30'}
          </span>
        </div>

        <div class="grid-main-aside">
          <section class="card stack-md">
            <div class="section-header">
              <h2>Việc cần làm hôm nay</h2>
              <span class="text-muted tabular">Ngày ${esc(today)}</span>
            </div>

            <ul class="task-list">
              <li>
                <button type="button" class="task-row" data-nav="/dorm">
                  <span class="task-row-left">
                    <span class="task-status-dot" data-done="${checkedIn}">${icon('check', 13)}</span>
                    <span>
                      <strong>Điểm danh ký túc xá phòng ${esc(user.room || '—')}</strong>
                      <small>${checkedIn ? 'Em đã quét thẻ QR tối nay.' : 'Mở thẻ QR để thầy cô Quản sinh quét lúc 20:30 – 21:15.'}</small>
                    </span>
                  </span>
                  <span class="chip ${checkedIn ? 'chip-success' : 'chip-amber'}">${checkedIn ? 'Xong' : 'Mở thẻ QR'}</span>
                </button>
              </li>

              <li>
                <button type="button" class="task-row" data-nav="/kitchen">
                  <span class="task-row-left">
                    <span class="icon-box icon-box-sm tone-amber">${icon('kitchen', 16)}</span>
                    <span>
                      <strong>Thực đơn bữa tối hôm nay</strong>
                      <small>${todayMenu ? esc(todayMenu.dinner) : 'Xem thực đơn tuần và báo cắt suất nếu về nhà.'}</small>
                    </span>
                  </span>
                  <span class="chip chip-muted">Xem bữa ăn</span>
                </button>
              </li>

              <li>
                <button type="button" class="task-row" data-nav="/tutor">
                  <span class="task-row-left">
                    <span class="icon-box icon-box-sm tone-brand">${icon('tutor', 16)}</span>
                    <span>
                      <strong>Tự học buổi tối với Gia sư</strong>
                      <small>Còn ${remainingAi} lượt hỏi bài và ôn tập theo chủ đề trên lớp.</small>
                    </span>
                  </span>
                  <span class="chip">Hỏi bài</span>
                </button>
              </li>

              ${
                nextReminder
                  ? `<li>
                      <button type="button" class="task-row" data-nav="/health">
                        <span class="task-row-left">
                          <span class="icon-box icon-box-sm tone-rose">${icon('health', 16)}</span>
                          <span>
                            <strong>${esc(nextReminder.title)}</strong>
                            <small class="tabular">Lịch hẹn: ${esc(nextReminder.dueAt)}</small>
                          </span>
                        </span>
                        <span class="chip chip-muted">Y tế</span>
                      </button>
                    </li>`
                  : ''
              }
            </ul>
          </section>

          <div class="stack-md">
            ${
              todayMenu
                ? `<section class="card stack-sm">
                    <div class="row-between">
                      <h3>Thực đơn hôm nay</h3>
                      <button type="button" class="btn btn-ghost btn-sm" data-nav="/kitchen">Cả tuần</button>
                    </div>
                    <dl class="meal-rows">
                      <div class="meal-row"><dt>Sáng</dt><dd>${esc(todayMenu.breakfast)}</dd></div>
                      <div class="meal-row"><dt>Trưa</dt><dd>${esc(todayMenu.lunch)}</dd></div>
                      <div class="meal-row"><dt>Tối</dt><dd>${esc(todayMenu.dinner)}</dd></div>
                    </dl>
                  </section>`
                : ''
            }

            <section class="card stack-sm">
              <div class="row-between">
                <h3>Thông báo mới từ lớp</h3>
                <button type="button" class="btn btn-ghost btn-sm" data-nav="/contact">Xem tất cả</button>
              </div>
              ${
                latestNotice
                  ? `<div class="card-sunken stack-sm">
                      <strong>${esc(latestNotice.title)}</strong>
                      <p class="text-muted">${esc(latestNotice.body)}</p>
                    </div>`
                  : '<p class="text-muted">Hiện chưa có thông báo mới từ giáo viên chủ nhiệm.</p>'
              }
            </section>
          </div>
        </div>

        <section class="stack-sm">
          <h2>Tiện ích khác</h2>
          <div class="grid-kpi">
            ${quickLinks
              .map(
                (q) => `
              <button type="button" class="card card-interactive" data-nav="${q.path}">
                <span class="icon-box icon-box-sm ${q.tone}">${icon(q.icon, 18)}</span>
                <div class="stack-sm">
                  <h3>${esc(q.title)}</h3>
                  <p class="text-muted">${esc(q.desc)}</p>
                </div>
              </button>`,
              )
              .join('')}
          </div>
        </section>
      </div>`;
  }

  function renderParentHome(state, user) {
    const profilesMap = global.BanNha.store.getProfilesMap();
    const children = (user.childrenIds || []).map((id) => profilesMap[id]).filter(Boolean);
    const child = children.find((c) => c.id === state.session.selectedChildId) || children[0];
    if (!child) {
      return `
        <div class="stack-lg">
          <div class="page-head">
            <div class="stack-sm">
              <h1>Hôm nay của con</h1>
              <p class="text-muted">Xin chào Phụ huynh <strong>${esc(user.fullName)}</strong>.</p>
            </div>
          </div>
          <div class="card">
            <p class="text-muted">Tài khoản phụ huynh chưa được liên kết với hồ sơ học sinh. Vui lòng liên hệ giáo viên chủ nhiệm để cập nhật.</p>
          </div>
        </div>`;
    }
    const today = global.BanNha.store.helpers.vnTodayIso();
    const present = state.dormAttendance.some((a) => a.studentId === child.id && a.date === today);
    const childGrades = state.grades.filter((g) => g.studentId === child.id);
    const gpas = childGrades.map(calcWeightedAverage).filter((n) => n !== null);
    const overallGpa = gpas.length
      ? (gpas.reduce((s, v) => s + v, 0) / gpas.length).toFixed(1)
      : '—';
    const childLeaves = state.leaveRequests.filter((l) => l.studentId === child.id);
    const latestNotice = state.announcements[0];

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Hôm nay của con</h1>
            <p class="text-muted">
              Xin chào Phụ huynh <strong>${esc(user.fullName)}</strong> · Theo dõi sinh hoạt và học tập của con tại trường.
            </p>
          </div>
          ${
            children.length > 1
              ? `<div class="row-wrap" role="group" aria-label="Chọn con để xem">
                  ${children
                    .map(
                      (c) => `
                    <button
                      type="button"
                      class="btn ${c.id === child.id ? 'btn-primary' : 'btn-secondary'} btn-sm"
                      data-action="select-child"
                      data-child-id="${c.id}"
                    >
                      ${esc(c.fullName)} (${esc(c.className)})
                    </button>`,
                    )
                    .join('')}
                </div>`
              : ''
          }
        </div>

        <div class="grid-2">
          <div class="card stack-sm">
            <div class="row-between">
              <h3>Điểm danh ký túc xá tối nay</h3>
              <span class="chip ${present ? 'chip-success' : 'chip-amber'}">
                ${present ? 'Đã có mặt' : 'Chờ giờ điểm danh'}
              </span>
            </div>
            <p class="text-muted">
              Con <strong>${esc(child.fullName)}</strong> (Lớp ${esc(child.className)} · Phòng ${esc(child.room)}): ${
                present
                  ? 'Đã quét thẻ điểm danh an toàn tại phòng ở.'
                  : 'Khung điểm danh buổi tối từ 20:30 đến 21:15.'
              }
            </p>
          </div>

          <div class="card stack-sm">
            <div class="row-between">
              <h3>Kết quả học tập Học kỳ 1</h3>
              <button type="button" class="btn btn-ghost btn-sm" data-nav="/contact">Xem bảng điểm</button>
            </div>
            <div class="kpi-value">${overallGpa}</div>
            <p class="text-muted">Điểm trung bình của ${childGrades.length} môn đã cập nhật.</p>
          </div>

          <div class="card stack-sm">
            <div class="row-between">
              <h3>Sức khỏe và bữa ăn</h3>
              <button type="button" class="btn btn-ghost btn-sm" data-nav="/kitchen">Xem thực đơn</button>
            </div>
            <p class="text-muted">
              Sức khỏe bình thường, không có báo ốm mới. Con ăn đủ 3 bữa mỗi ngày tại bếp ăn nội trú.
            </p>
          </div>

          <div class="card stack-sm">
            <div class="row-between">
              <h3>Xin phép về nhà</h3>
              <button type="button" class="btn btn-primary btn-sm" data-nav="/dorm">Tạo đơn xin phép</button>
            </div>
            <p class="text-muted">
              ${
                childLeaves.length
                  ? `Đơn gần nhất: từ ${esc(childLeaves[0].fromDate)} đến ${esc(childLeaves[0].toDate)}.`
                  : 'Tuần này con chưa có đơn xin về nhà.'
              }
            </p>
          </div>
        </div>

        ${
          latestNotice
            ? `<section class="card stack-sm">
                <div class="row-between">
                  <h3>Thông báo mới nhất từ Giáo viên chủ nhiệm</h3>
                  <span class="text-muted tabular">${esc(latestNotice.createdAt)}</span>
                </div>
                <strong>${esc(latestNotice.title)}</strong>
                <p class="text-muted">${esc(latestNotice.body)}</p>
              </section>`
            : ''
        }
      </div>`;
  }

  function renderStaffHome(state, user) {
    const role = state.session.activeRole;
    const today = global.BanNha.store.helpers.vnTodayIso();
    const profilesMap = global.BanNha.store.getProfilesMap();
    const students = global.BanNha.store.getStudents();
    const checkedCount = state.dormAttendance.filter((a) => a.date === today).length;
    const pendingLeaves = state.leaveRequests.filter((l) => l.status === 'pending');
    const openIssues = state.roomReports.filter((r) => r.status !== 'resolved');
    const headcount = global.BanNha.store.getKitchenHeadcount('2026-11-28');
    const canReviewLeave = role === 'dorm_staff' || role === 'teacher' || role === 'admin';

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Tổng quan hôm nay</h1>
            <p class="text-muted">Xin chào <strong>${esc(user.fullName)}</strong> · Ngày ${esc(today)}</p>
          </div>
          ${
            state.sosAlerts.length > 0
              ? `<button type="button" class="btn btn-danger btn-sm" data-nav="/health">Khẩn cấp: ${state.sosAlerts.length} tín hiệu SOS</button>`
              : `<span class="chip chip-success">Khu nội trú ổn định</span>`
          }
        </div>

        ${
          state.sosAlerts.length > 0
            ? `<div class="alert alert-danger row-between" role="alert">
                <span>Có ${state.sosAlerts.length} tín hiệu SOS mới lúc ${esc(state.sosAlerts[0].time)} cần hỗ trợ ngay.</span>
                <button type="button" class="btn btn-danger btn-sm" data-nav="/health">Mở trang Y tế & SOS</button>
              </div>`
            : ''
        }

        <div class="grid-kpi">
          <button type="button" class="kpi-tile" data-nav="/dorm">
            <div class="kpi-head">
              <span class="kpi-label">Điểm danh KTX</span>
              <span class="icon-box icon-box-sm tone-brand">${icon('dorm', 16)}</span>
            </div>
            <strong class="kpi-value">${checkedCount}/${students.length}</strong>
            <span class="kpi-sub">Học sinh đã quét thẻ</span>
          </button>

          <button type="button" class="kpi-tile" data-nav="/dorm">
            <div class="kpi-head">
              <span class="kpi-label">Đơn xin về bản</span>
              <span class="icon-box icon-box-sm tone-amber">${icon('contact', 16)}</span>
            </div>
            <strong class="kpi-value">${pendingLeaves.length}</strong>
            <span class="kpi-sub">Đang chờ duyệt</span>
          </button>

          <button type="button" class="kpi-tile" data-nav="/kitchen">
            <div class="kpi-head">
              <span class="kpi-label">Suất nấu bữa tối</span>
              <span class="icon-box icon-box-sm tone-teal">${icon('kitchen', 16)}</span>
            </div>
            <strong class="kpi-value">${headcount.dinner.cooking}</strong>
            <span class="kpi-sub">Đã trừ ${headcount.dinner.cuts} suất báo cắt</span>
          </button>

          <button type="button" class="kpi-tile" data-nav="/health">
            <div class="kpi-head">
              <span class="kpi-label">Phòng ở & Y tế</span>
              <span class="icon-box icon-box-sm tone-rose">${icon('health', 16)}</span>
            </div>
            <strong class="kpi-value">${openIssues.length + state.healthReports.length}</strong>
            <span class="kpi-sub">Mục đang theo dõi</span>
          </button>
        </div>

        <div class="grid-main-aside">
          <section class="card stack-md">
            <div class="row-between">
              <h2>Đơn xin phép cần xử lý</h2>
              <button type="button" class="btn btn-ghost btn-sm" data-nav="/dorm">Xem tất cả</button>
            </div>
            ${
              pendingLeaves.length
                ? pendingLeaves
                    .map((lv) => {
                      const st = profilesMap[lv.studentId];
                      return `
                        <div class="card-sunken stack-sm">
                          <div class="row-between">
                            <strong>${esc(st ? st.fullName : lv.studentId)} (${esc(st?.className || '—')})</strong>
                            <span class="chip chip-amber">Chờ duyệt</span>
                          </div>
                          <p class="text-muted tabular">Từ ${esc(lv.fromDate)} đến ${esc(lv.toDate)} · ${esc(lv.reason)}</p>
                          ${
                            canReviewLeave
                              ? `<div class="row-wrap">
                                  <button type="button" class="btn btn-primary btn-sm" data-action="review-leave" data-id="${lv.id}" data-status="approved">Duyệt đơn</button>
                                  <button type="button" class="btn btn-secondary btn-sm" data-action="review-leave" data-id="${lv.id}" data-status="rejected">Từ chối</button>
                                </div>`
                              : ''
                          }
                        </div>`;
                    })
                    .join('')
                : '<p class="text-muted">Hiện không có đơn xin phép nào đang chờ duyệt.</p>'
            }
          </section>

          <section class="card stack-md">
            <h2>Truy cập nhanh</h2>
            <div class="stack-sm">
              <button type="button" class="task-row" data-nav="/dorm">
                <span class="task-row-left">
                  <span class="icon-box icon-box-sm tone-brand">${icon('qr', 16)}</span>
                  <span>
                    <strong>Điểm danh phòng & Đơn xin về</strong>
                    <small>Quét thẻ học sinh, xử lý báo hỏng thiết bị</small>
                  </span>
                </span>
              </button>

              <button type="button" class="task-row" data-nav="/kitchen">
                <span class="task-row-left">
                  <span class="icon-box icon-box-sm tone-amber">${icon('kitchen', 16)}</span>
                  <span>
                    <strong>Quân số nấu ăn & Thực đơn</strong>
                    <small>Đối chiếu số suất từng bữa và góp ý học sinh</small>
                  </span>
                </span>
              </button>

              <button type="button" class="task-row" data-nav="${role === 'admin' ? '/admin' : '/contact'}">
                <span class="task-row-left">
                  <span class="icon-box icon-box-sm tone-sky">${icon(role === 'admin' ? 'admin' : 'contact', 16)}</span>
                  <span>
                    <strong>${role === 'admin' ? 'Quản trị tài khoản & In thẻ QR' : 'Sổ liên lạc & Nhập điểm lớp'}</strong>
                    <small>${role === 'admin' ? 'Nhập danh sách CSV và in thẻ nội trú A4' : 'Cập nhật điểm môn và gửi thông báo về bản'}</small>
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </div>`;
  }

  function renderDashboard(state) {
    const user = global.BanNha.store.getCurrentUser();
    if (!user) return '';
    if (state.session.activeRole === 'parent') return renderParentHome(state, user);
    if (state.session.activeRole === 'student') return renderStudentHome(state, user);
    return renderStaffHome(state, user);
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.dashboards = { renderDashboard };
})(window);
