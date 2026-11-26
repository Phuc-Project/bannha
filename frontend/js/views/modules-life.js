/**
 * BẢN NHÀ — Ký túc xá số & Bếp ăn minh bạch
 */
(function initModulesLife(global) {
  const { esc } = global.BanNha.utils;
  const { MEAL_LABELS } = global.BanNha.domain;
  const { icon } = global.BanNha.icons;
  const { CONFIG } = global.BanNha;

  function renderDormView(state) {
    const user = global.BanNha.store.getCurrentUser();
    const role = state.session.activeRole;
    const tab = state.ui.activeTabs.dorm || 'checkin';
    const profilesMap = global.BanNha.store.getProfilesMap();
    const students = global.BanNha.store.getStudents();
    const today = global.BanNha.store.helpers.vnTodayIso();
    const canManage = role === 'dorm_staff' || role === 'teacher' || role === 'admin';

    const checkinIds = new Set(
      state.dormAttendance.filter((a) => a.date === today).map((a) => a.studentId),
    );

    let panelHtml = '';
    if (tab === 'checkin') {
      if (role === 'student') {
        const isChecked = checkinIds.has(user.id);
        const myHistory = state.dormAttendance.filter((a) => a.studentId === user.id);
        panelHtml = `
          <div class="grid-2">
            <div class="student-id-card">
              <div class="student-id-header">
                <div>
                  <span>Thẻ nội trú điện tử</span>
                  <strong>${esc(CONFIG.schoolName)}</strong>
                </div>
                <span class="chip" style="background:rgb(255 255 255 / 0.16);color:#fff">
                  ${isChecked ? 'Đã điểm danh' : 'Chưa điểm danh'}
                </span>
              </div>
              <div class="student-id-body">
                <div class="student-id-meta">
                  <h3>${esc(user.fullName)}</h3>
                  <div class="meta-grid">
                    <div class="meta-item"><span>Mã học sinh</span><strong>${esc(user.code)}</strong></div>
                    <div class="meta-item"><span>Lớp</span><strong>${esc(user.className || '—')}</strong></div>
                    <div class="meta-item"><span>Phòng KTX</span><strong>${esc(user.room || '—')}</strong></div>
                    <div class="meta-item"><span>Dân tộc</span><strong>${esc(user.ethnicity || '—')}</strong></div>
                  </div>
                  <p class="text-muted" style="margin-top:0.5rem">
                    Đưa mã QR cho thầy cô Quản sinh quét trong khung giờ 20:30 – 21:15.
                  </p>
                </div>
                <div class="qr-box" style="width:9.5rem;height:9.5rem">
                  ${
                    user.qrToken
                      ? `<div style="width:100%;height:100%" data-qr="${esc(user.qrToken)}"></div>`
                      : `<span class="text-muted" style="margin:auto;text-align:center">Đang chờ cấp mã QR</span>`
                  }
                </div>
              </div>
            </div>

            <div class="card stack-md">
              <div class="row-between">
                <h3>Lịch sử điểm danh gần đây</h3>
                <span class="chip chip-muted">${myHistory.length} lượt</span>
              </div>
              ${
                myHistory.length
                  ? myHistory
                      .map(
                        (a) => `
                      <div class="card-sunken row-between">
                        <div>
                          <strong class="tabular">Ngày ${esc(a.date)}</strong>
                          <p class="text-muted">Điểm danh bằng thẻ QR</p>
                        </div>
                        <span class="chip chip-success tabular">${esc(a.time)} · Có mặt</span>
                      </div>`,
                      )
                      .join('')
                  : '<p class="text-muted">Chưa có lượt điểm danh nào hôm nay. Em nhớ chuẩn bị thẻ trước 20:30 nhé.</p>'
              }
            </div>
          </div>`;
      } else {
        panelHtml = `
          <div class="stack-md">
            ${
              state.ui.lastScannedName
                ? `<div class="alert alert-info" role="status">
                    Đã ghi nhận điểm danh cho em <strong>${esc(state.ui.lastScannedName)}</strong>${state.online ? '.' : ' (đã lưu trên máy, sẽ tự gửi khi có sóng).'}
                  </div>`
                : ''
            }
            <div class="grid-main-aside">
              <div class="card stack-md">
                <div class="row-between">
                  <h3>Danh sách điểm danh tối ${esc(today)}</h3>
                  <span class="chip">${checkinIds.size}/${students.length} có mặt</span>
                </div>
                <div class="table-wrap">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Học sinh</th>
                        <th>Lớp / Phòng</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${students
                        .map((s) => {
                          const present = checkinIds.has(s.id);
                          return `
                            <tr>
                              <td><strong>${esc(s.fullName)}</strong></td>
                              <td>${esc(s.className || '—')} · P.${esc(s.room || '—')}</td>
                              <td>${present ? '<span class="chip chip-success">Có mặt</span>' : '<span class="chip chip-amber">Chưa quét</span>'}</td>
                              <td>
                                <button
                                  type="button"
                                  class="btn ${present ? 'btn-ghost' : 'btn-primary'} btn-sm"
                                  data-action="scan-qr"
                                  data-token="${esc(s.qrToken)}"
                                  ${present ? 'disabled' : ''}
                                >
                                  ${present ? 'Đã điểm danh' : 'Quét thẻ'}
                                </button>
                              </td>
                            </tr>`;
                        })
                        .join('')}
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="card stack-md">
                <h3>Xác thực mã thẻ thủ công</h3>
                <p class="text-muted">
                  Khi camera không rõ hoặc dùng máy quét rời, nhập mã trên thẻ học sinh để xác thực ngay cả khi không có sóng.
                </p>
                <form class="stack-sm" data-form="manual-qr-scan">
                  <div class="field">
                    <label for="qr-manual">Mã trên thẻ nội trú</label>
                    <input
                      id="qr-manual"
                      name="token"
                      class="input"
                      placeholder="Nhập hoặc quét mã thẻ học sinh..."
                      required
                    />
                  </div>
                  <button type="submit" class="btn btn-secondary">
                    ${icon('qr', 17)} Kiểm tra và điểm danh
                  </button>
                </form>
              </div>
            </div>
          </div>`;
      }
    } else if (tab === 'leave') {
      const targetStudentId =
        role === 'parent' ? state.session.selectedChildId || 'stu-01' : user.id;
      panelHtml = `
        <div class="grid-aside-main">
          ${
            role === 'student' || role === 'parent'
              ? `<form class="card stack-md" data-form="create-leave">
                  <h3>Tạo đơn xin phép về bản</h3>
                  <input type="hidden" name="studentId" value="${esc(targetStudentId)}" />
                  <div class="grid-2">
                    <div class="field">
                      <label for="lv-from">Từ ngày</label>
                      <input id="lv-from" name="fromDate" type="date" class="input" value="2026-11-28" required />
                    </div>
                    <div class="field">
                      <label for="lv-to">Đến ngày</label>
                      <input id="lv-to" name="toDate" type="date" class="input" value="2026-11-29" required />
                    </div>
                  </div>
                  <div class="field">
                    <label for="lv-reason">Lý do xin về và người đón</label>
                    <textarea id="lv-reason" name="reason" class="textarea" placeholder="Ghi rõ lý do gia đình và tên người đón em..." required></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary">Gửi đơn xin phép</button>
                </form>`
              : `<div class="card card-highlight stack-sm">
                  <h3>Tự động báo cắt suất ăn</h3>
                  <p class="text-muted">
                    Khi Thầy/Cô bấm <strong>Duyệt đơn</strong> xin về bản, hệ thống sẽ tự động báo cắt các bữa ăn trong thời gian học sinh vắng mặt sang Nhà bếp.
                  </p>
                </div>`
          }

          <div class="card stack-md">
            <div class="row-between">
              <h3>Danh sách đơn xin phép</h3>
              <span class="chip chip-muted">${state.leaveRequests.length} đơn</span>
            </div>
            ${
              state.leaveRequests.length
                ? state.leaveRequests
                    .map((lv) => {
                      const st = profilesMap[lv.studentId];
                      const badge =
                        lv.status === 'approved'
                          ? '<span class="chip chip-success">Đã duyệt · Đã cắt suất bếp</span>'
                          : lv.status === 'rejected'
                            ? '<span class="chip chip-danger">Từ chối</span>'
                            : '<span class="chip chip-amber">Chờ duyệt</span>';
                      return `
                        <div class="card-sunken stack-sm">
                          <div class="row-between">
                            <strong>${esc(st ? st.fullName : lv.studentId)} (${esc(st?.className || '—')})</strong>
                            ${badge}
                          </div>
                          <p class="text-muted tabular">Từ ${esc(lv.fromDate)} đến ${esc(lv.toDate)} · ${esc(lv.reason)}</p>
                          ${
                            canManage && lv.status === 'pending'
                              ? `<div class="row-wrap">
                                  <button type="button" class="btn btn-primary btn-sm" data-action="review-leave" data-id="${lv.id}" data-status="approved">Duyệt đơn</button>
                                  <button type="button" class="btn btn-secondary btn-sm" data-action="review-leave" data-id="${lv.id}" data-status="rejected">Từ chối</button>
                                </div>`
                              : ''
                          }
                        </div>`;
                    })
                    .join('')
                : '<p class="text-muted">Chưa có đơn xin phép nào.</p>'
            }
          </div>
        </div>`;
    } else {
      panelHtml = `
        <div class="grid-aside-main">
          <form class="card stack-md" data-form="create-room-issue">
            <h3>Báo hỏng thiết bị phòng ở</h3>
            <div class="field">
              <label for="rm-cat">Hạng mục hư hỏng</label>
              <select id="rm-cat" name="category" class="select">
                <option value="Điện chiếu sáng">Điện chiếu sáng / Quạt</option>
                <option value="Nước sinh hoạt">Vòi nước / Nhà vệ sinh</option>
                <option value="Giường tủ & Cửa">Giường tầng / Cửa sổ chắn gió</option>
              </select>
            </div>
            <div class="field">
              <label for="rm-desc">Mô tả cụ thể</label>
              <textarea id="rm-desc" name="description" class="textarea" placeholder="Ví dụ: Chốt cửa sổ phòng A201 bị lỏng cần gia cố..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Gửi báo hỏng</button>
          </form>

          <div class="card stack-md">
            <div class="row-between">
              <h3>Theo dõi sửa chữa phòng ở</h3>
              <span class="chip chip-muted">${state.roomReports.length} phiếu</span>
            </div>
            ${
              state.roomReports.length
                ? state.roomReports
                    .map(
                      (r) => `
                    <div class="card-sunken stack-sm">
                      <div class="row-between">
                        <strong>Phòng ${esc(r.room)} · ${esc(r.category)}</strong>
                        <span class="chip ${r.status === 'resolved' ? 'chip-success' : r.status === 'in_progress' ? 'chip-sky' : 'chip-amber'}">
                          ${r.status === 'resolved' ? 'Đã sửa xong' : r.status === 'in_progress' ? 'Đang sửa' : 'Mới tiếp nhận'}
                        </span>
                      </div>
                      <p class="text-muted">${esc(r.description)}</p>
                      ${
                        canManage && r.status !== 'resolved'
                          ? `<div><button type="button" class="btn btn-secondary btn-sm" data-action="resolve-room" data-id="${r.id}">Đánh dấu đã sửa xong</button></div>`
                          : ''
                      }
                    </div>`,
                    )
                    .join('')
                : '<p class="text-muted">Hiện chưa có phiếu báo hỏng nào.</p>'
            }
          </div>
        </div>`;
    }

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Ký túc xá số</h1>
            <p class="text-muted">Điểm danh bằng mã QR, gửi đơn xin phép về bản và báo sửa chữa phòng ở.</p>
          </div>
          <div class="tabs-bar" role="tablist" aria-label="Mục trong Ký túc xá">
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'checkin'}" data-action="switch-tab" data-module="dorm" data-tab="checkin">Điểm danh QR</button>
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'leave'}" data-action="switch-tab" data-module="dorm" data-tab="leave">Đơn xin phép (${state.leaveRequests.length})</button>
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'issues'}" data-action="switch-tab" data-module="dorm" data-tab="issues">Báo hỏng phòng</button>
          </div>
        </div>
        ${panelHtml}
      </div>`;
  }

  function renderKitchenView(state) {
    const user = global.BanNha.store.getCurrentUser();
    const tab = state.ui.activeTabs.kitchen || 'menu';
    const today = global.BanNha.store.helpers.vnTodayIso();
    const hour = global.BanNha.store.helpers.vnCurrentHour();
    const headcount = global.BanNha.store.getKitchenHeadcount('2026-11-28');

    let panelHtml = '';
    if (tab === 'menu') {
      panelHtml = `
        <div class="stack-md">
          <div class="alert alert-info">
            Hạn báo cắt suất trong ngày: <strong>trước 05:30</strong> (bữa sáng), <strong>trước 09:30</strong> (bữa trưa) và <strong>trước 15:30</strong> (bữa tối).
          </div>
          <div class="grid-2">
            ${
              state.menus.length
                ? state.menus
                    .map((m) => {
                      const isCutDinner = state.mealCuts.some(
                        (c) => c.studentId === user.id && c.date === m.date && c.meal === 'dinner',
                      );
                      const editable = global.BanNha.store.helpers.canModifyMealCut(
                        m.date,
                        'dinner',
                        today,
                        hour,
                      );
                      return `
                        <article class="card stack-md">
                          <div class="row-between">
                            <h3>${esc(m.dayLabel)}</h3>
                            <span class="chip chip-muted tabular">${esc(m.date)}</span>
                          </div>
                          <dl class="meal-rows">
                            <div class="meal-row"><dt>Sáng</dt><dd>${esc(m.breakfast)}</dd></div>
                            <div class="meal-row"><dt>Trưa</dt><dd>${esc(m.lunch)}</dd></div>
                            <div class="meal-row"><dt>Tối</dt><dd>${esc(m.dinner)}</dd></div>
                          </dl>
                          ${
                            state.session.activeRole === 'student'
                              ? `<div class="row-between" style="padding-top:0.5rem;border-top:1px solid var(--color-line)">
                                  <span class="text-muted">${isCutDinner ? 'Đã báo cắt bữa tối' : 'Đăng ký ăn tại bếp'}</span>
                                  <button
                                    type="button"
                                    class="btn ${isCutDinner ? 'btn-secondary' : 'btn-primary'} btn-sm"
                                    data-action="toggle-meal-cut"
                                    data-date="${m.date}"
                                    data-meal="dinner"
                                    ${!editable ? 'disabled' : ''}
                                  >
                                    ${isCutDinner ? 'Đăng ký ăn lại' : 'Báo cắt bữa tối'}
                                  </button>
                                </div>`
                              : ''
                          }
                        </article>`;
                    })
                    .join('')
                : '<div class="card"><p class="text-muted">Nhà bếp chưa cập nhật thực đơn cho tuần này.</p></div>'
            }
          </div>
        </div>`;
    } else if (tab === 'headcount') {
      panelHtml = `
        <div class="card stack-md">
          <div class="row-between">
            <div>
              <h3>Quân số nấu ăn ngày Thứ Bảy (2026-11-28)</h3>
              <p class="text-muted">Số suất đã tự động trừ học sinh tự báo cắt suất và học sinh được duyệt đơn về nhà.</p>
            </div>
          </div>
          <div class="grid-3">
            ${['breakfast', 'lunch', 'dinner']
              .map((meal) => {
                const info = headcount[meal];
                const pct = info.total > 0 ? Math.round((info.cooking / info.total) * 100) : 0;
                return `
                  <div class="card-sunken stack-sm">
                    <div class="row-between">
                      <strong>${esc(MEAL_LABELS[meal])}</strong>
                      <span class="chip tabular">${pct}%</span>
                    </div>
                    <div class="kpi-value">${info.cooking} suất</div>
                    <div class="progress-track">
                      <div class="progress-fill" style="width:${pct}%"></div>
                    </div>
                    <span class="text-muted tabular">Tổng ${info.total} học sinh · Đã cắt ${info.cuts} suất</span>
                  </div>`;
              })
              .join('')}
          </div>
        </div>`;
    } else {
      panelHtml = `
        <div class="grid-aside-main">
          <form class="card stack-md" data-form="meal-feedback">
            <h3>Góp ý món ăn cho Nhà bếp</h3>
            <div class="field">
              <label for="fb-dish">Món ăn em muốn đề xuất</label>
              <input id="fb-dish" name="dishSuggestion" class="input" placeholder="Ví dụ: Canh cải mèo nấu thịt băm, xôi ngũ sắc..." required />
            </div>
            <div class="field">
              <label for="fb-note">Nhận xét bữa ăn hôm nay</label>
              <textarea id="fb-note" name="note" class="textarea" placeholder="Cơm canh có nóng và vừa khẩu vị không em?" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Gửi góp ý</button>
          </form>

          <div class="card stack-md">
            <div class="row-between">
              <h3>Ý kiến học sinh đã gửi</h3>
              <span class="chip chip-muted">${state.mealFeedback.length} góp ý</span>
            </div>
            ${
              state.mealFeedback.length
                ? state.mealFeedback
                    .map(
                      (f) => `
                    <div class="card-sunken stack-sm">
                      <strong>Đề xuất: ${esc(f.dishSuggestion)}</strong>
                      <p class="text-muted">${esc(f.note)}</p>
                    </div>`,
                    )
                    .join('')
                : '<p class="text-muted">Chưa có góp ý nào.</p>'
            }
          </div>
        </div>`;
    }

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Bếp ăn minh bạch</h1>
            <p class="text-muted">Xem thực đơn cả tuần, báo cắt suất trước giờ chốt và gửi góp ý cho nhà bếp.</p>
          </div>
          <div class="tabs-bar" role="tablist" aria-label="Mục trong Bếp ăn">
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'menu'}" data-action="switch-tab" data-module="kitchen" data-tab="menu">Thực đơn tuần</button>
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'headcount'}" data-action="switch-tab" data-module="kitchen" data-tab="headcount">Quân số nấu ăn</button>
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'feedback'}" data-action="switch-tab" data-module="kitchen" data-tab="feedback">Góp ý món ăn</button>
          </div>
        </div>
        ${panelHtml}
      </div>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.modulesLife = { renderDormView, renderKitchenView };
})(window);
