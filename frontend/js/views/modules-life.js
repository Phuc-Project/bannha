/**
 * BẢN NHÀ — Phân hệ 1 (Ký túc xá số) & Phân hệ 2 (Bếp ăn minh bạch)
 */
(function initModulesLife(global) {
  const { esc } = global.BanNha.utils;
  const { MEAL_LABELS } = global.BanNha.domain;
  const { icon } = global.BanNha.icons;

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
        panelHtml = `
          <div class="grid-2 reveal-up">
            <div class="card stack-md">
              <span class="chip">${checkinIds.has(user.id) ? 'Đã điểm danh tối nay' : 'Chưa quét tối nay'}</span>
              <h3>Thẻ QR nội trú của ${esc(user.fullName)}</h3>
              <p class="text-muted">Đưa mã này cho thầy/cô Quản sinh quét lúc 20:30 – 21:15 (dùng được cả khi mất mạng).</p>
              <div>
                <div class="qr-box" style="width:11.5rem;height:11.5rem">
                  <div style="width:100%;height:100%" data-qr="${esc(user.qrToken)}"></div>
                  <span class="qr-scan-line" aria-hidden="true"></span>
                </div>
              </div>
              <p class="code-pill">${esc(user.qrToken)}</p>
            </div>
            <div class="card stack-md">
              <h3>Lịch sử điểm danh gần nhất</h3>
              ${
                state.dormAttendance
                  .filter((a) => a.studentId === user.id)
                  .map(
                    (a) =>
                      `<div class="card-sunken row-between"><span>Ngày ${esc(a.date)}</span><strong class="tabular">${esc(a.time)} · Có mặt</strong></div>`,
                  )
                  .join('') ||
                '<p class="text-muted">Chưa có lượt điểm danh hôm nay. Em hãy chuẩn bị thẻ trước 20:30 nhé.</p>'
              }
            </div>
          </div>`;
      } else {
        panelHtml = `
          <div class="stack-md reveal-up">
            ${
              state.ui.lastScannedName
                ? `<div class="alert alert-info" role="status"><strong>Đã điểm danh: ${esc(state.ui.lastScannedName)}</strong> — Dữ liệu đã ghi vào bộ nhớ máy${state.online ? ' và đồng bộ' : ', sẽ tự đẩy lên khi có sóng'}.</div>`
                : ''
            }
            <div class="grid-2">
              <div class="card stack-md">
                <div class="row-between">
                  <h3>Máy quét thẻ QR ngoại tuyến</h3>
                  <span class="chip">${checkinIds.size}/${students.length} có mặt</span>
                </div>
                <p class="text-muted">Bấm quét nhanh thẻ học sinh bên dưới hoặc dán chuỗi mã QR thẻ để kiểm tra chữ ký số Ed25519:</p>
                <div class="row-wrap">
                  ${students
                    .map(
                      (s) => `
                    <button
                      type="button"
                      class="btn ${checkinIds.has(s.id) ? 'btn-secondary' : 'btn-primary'} btn-sm"
                      data-action="scan-qr"
                      data-token="${esc(s.qrToken)}"
                    >
                      Quét thẻ: ${esc(s.fullName)}
                    </button>`,
                    )
                    .join('')}
                </div>
                <form class="row-wrap" data-form="manual-qr-scan">
                  <input name="token" class="input" style="flex:1;min-width:13rem" placeholder="Dán chuỗi BN1.ptdtnt-bac-ha-01..." aria-label="Chuỗi mã QR" />
                  <button type="submit" class="btn btn-secondary btn-sm">${icon('qr', 17)} Kiểm tra mã</button>
                </form>
              </div>

              <div class="card stack-md">
                <h3>Bảng quân số phòng tối ${today}</h3>
                <div class="table-wrap">
                  <table class="data-table">
                    <thead><tr><th>Học sinh</th><th>Phòng</th><th>Trạng thái</th></tr></thead>
                    <tbody>
                      ${students
                        .map(
                          (s) => `
                        <tr>
                          <td><strong>${esc(s.fullName)}</strong></td>
                          <td>${esc(s.room)}</td>
                          <td>${checkinIds.has(s.id) ? '<span class="chip">Có mặt</span>' : '<span class="chip chip-danger">Chưa quét</span>'}</td>
                        </tr>`,
                        )
                        .join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>`;
      }
    } else if (tab === 'leave') {
      const targetStudentId =
        role === 'parent' ? state.session.selectedChildId || 'stu-01' : user.id;
      panelHtml = `
        <div class="grid-2 reveal-up">
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
                    <label for="lv-reason">Lý do xin về & người đón</label>
                    <textarea id="lv-reason" name="reason" class="textarea" placeholder="Ghi rõ lý do gia đình và ai đón em..." required></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary">Gửi đơn xin về</button>
                </form>`
              : `<div class="card stack-sm">
                  <h3>Quy tắc liên thông KTX → Nhà bếp</h3>
                  <p class="text-muted">Khi Thầy/Cô bấm <strong>Duyệt</strong> đơn xin về bản, hệ thống tự động báo cắt các bữa ăn tương ứng sang phân hệ Bếp ăn mà không cần nhập lại bằng sổ giấy.</p>
                </div>`
          }

          <div class="card stack-md">
            <h3>Danh sách đơn xin phép (${state.leaveRequests.length})</h3>
            ${state.leaveRequests
              .map((lv) => {
                const st = profilesMap[lv.studentId];
                const badge =
                  lv.status === 'approved'
                    ? '<span class="chip">Đã duyệt · Tự cắt suất bếp</span>'
                    : lv.status === 'rejected'
                      ? '<span class="chip chip-danger">Từ chối</span>'
                      : '<span class="chip chip-star">Chờ duyệt</span>';
                return `
                  <div class="card-sunken stack-sm">
                    <div class="row-between">
                      <strong>${esc(st ? st.fullName : lv.studentId)} (${esc(st ? st.className : '')})</strong>
                      ${badge}
                    </div>
                    <p class="text-muted tabular">Từ ${esc(lv.fromDate)} đến ${esc(lv.toDate)} — ${esc(lv.reason)}</p>
                    ${
                      canManage && lv.status === 'pending'
                        ? `<div class="row-wrap">
                            <button type="button" class="btn btn-primary btn-sm" data-action="review-leave" data-id="${lv.id}" data-status="approved">Duyệt</button>
                            <button type="button" class="btn btn-secondary btn-sm" data-action="review-leave" data-id="${lv.id}" data-status="rejected">Từ chối</button>
                          </div>`
                        : ''
                    }
                  </div>`;
              })
              .join('')}
          </div>
        </div>`;
    } else {
      panelHtml = `
        <div class="grid-2 reveal-up">
          <form class="card stack-md" data-form="create-room-issue">
            <h3>Báo hỏng thiết bị phòng nội trú</h3>
            <div class="field">
              <label for="rm-cat">Hạng mục hư hỏng</label>
              <select id="rm-cat" name="category" class="select">
                <option value="Điện chiếu sáng">Điện chiếu sáng / Quạt</option>
                <option value="Nước sinh hoạt">Vòi nước / Nhà vệ sinh</option>
                <option value="Giường tủ & Cửa">Giường tầng / Cửa sổ chắn gió</option>
              </select>
            </div>
            <div class="field">
              <label for="rm-desc">Mô tả vị trí cần sửa</label>
              <textarea id="rm-desc" name="description" class="textarea" placeholder="Ví dụ: Chốt cửa sổ phòng A201 bị lỏng khi gió mùa về..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Gửi báo hỏng phòng</button>
          </form>

          <div class="card stack-md">
            <h3>Tiến độ sửa chữa phòng ở</h3>
            ${state.roomReports
              .map(
                (r) => `
              <div class="card-sunken stack-sm">
                <div class="row-between">
                  <strong>Phòng ${esc(r.room)} · ${esc(r.category)}</strong>
                  <span class="chip">${r.status === 'resolved' ? 'Đã sửa xong' : r.status === 'in_progress' ? 'Đang sửa' : 'Mới tiếp nhận'}</span>
                </div>
                <p class="text-muted">${esc(r.description)}</p>
                ${
                  canManage && r.status !== 'resolved'
                    ? `<button type="button" class="btn btn-secondary btn-sm" data-action="resolve-room" data-id="${r.id}">Đánh dấu đã sửa xong</button>`
                    : ''
                }
              </div>`,
              )
              .join('')}
          </div>
        </div>`;
    }

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Ký túc xá số</h1>
            <p class="text-muted">Điểm danh thẻ QR ngoại tuyến, đơn xin về bản & bảo trì phòng ở.</p>
          </div>
          <div class="tabs-bar" role="tablist" aria-label="Chức năng Ký túc xá">
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
        <div class="stack-md reveal-up">
          <div class="grid-cards">
            ${state.menus
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
                  <div class="card stack-sm">
                    <div class="row-between">
                      <h3>${esc(m.dayLabel)}</h3>
                      <span class="chip tabular">${esc(m.date)}</span>
                    </div>
                    <p><strong>Sáng:</strong> ${esc(m.breakfast)}</p>
                    <p><strong>Trưa:</strong> ${esc(m.lunch)}</p>
                    <p><strong>Tối:</strong> ${esc(m.dinner)}</p>
                    ${
                      state.session.activeRole === 'student'
                        ? `<div style="margin-top:0.4rem">
                            <button
                              type="button"
                              class="btn ${isCutDinner ? 'btn-secondary' : 'btn-primary'} btn-sm"
                              data-action="toggle-meal-cut"
                              data-date="${m.date}"
                              data-meal="dinner"
                              ${!editable ? 'disabled' : ''}
                            >
                              ${isCutDinner ? 'Hủy cắt bữa tối' : 'Báo cắt bữa tối'}
                            </button>
                          </div>`
                        : ''
                    }
                  </div>`;
              })
              .join('')}
          </div>
        </div>`;
    } else if (tab === 'headcount') {
      panelHtml = `
        <div class="card stack-md reveal-up">
          <h3>Bảng tổng hợp quân số nấu ăn ngày Thứ Bảy (2026-11-28)</h3>
          <p class="text-muted">Tự động trừ cả học sinh tự báo cắt suất và học sinh đã được duyệt đơn về bản:</p>
          <div class="grid-cards">
            ${['breakfast', 'lunch', 'dinner']
              .map(
                (meal) => `
              <div class="kpi-tile">
                <span class="text-muted">${esc(MEAL_LABELS[meal])}</span>
                <strong class="kpi-value">${headcount[meal].cooking} suất nấu</strong>
                <span class="text-muted">Tổng ${headcount[meal].total} HS · Đã cắt ${headcount[meal].cuts} suất</span>
              </div>`,
              )
              .join('')}
          </div>
        </div>`;
    } else {
      panelHtml = `
        <div class="grid-2 reveal-up">
          <form class="card stack-md" data-form="meal-feedback">
            <h3>Đề xuất món ăn quê hương</h3>
            <div class="field">
              <label for="fb-dish">Món ăn em mong nhà bếp nấu thêm</label>
              <input id="fb-dish" name="dishSuggestion" class="input" placeholder="Ví dụ: Thịt băm chưng măng chua, xôi cẩm..." required />
            </div>
            <div class="field">
              <label for="fb-note">Nhận xét bữa ăn hôm nay</label>
              <textarea id="fb-note" name="note" class="textarea" placeholder="Cơm canh có đủ ấm và vừa miệng không em?" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Gửi góp ý cho Nhà bếp</button>
          </form>
          <div class="card stack-md">
            <h3>Ý kiến học sinh đã gửi</h3>
            ${state.mealFeedback
              .map(
                (f) => `
              <div class="card-sunken stack-sm">
                <strong>Đề xuất: ${esc(f.dishSuggestion)}</strong>
                <p class="text-muted">${esc(f.note)}</p>
              </div>`,
              )
              .join('')}
          </div>
        </div>`;
    }

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Bếp ăn minh bạch</h1>
            <p class="text-muted">Thực đơn tuần, báo cắt suất trước giờ chốt & chống lãng phí thực phẩm.</p>
          </div>
          <div class="tabs-bar" role="tablist">
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'menu'}" data-action="switch-tab" data-module="kitchen" data-tab="menu">Thực đơn & Báo cắt suất</button>
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
