/**
 * BẢN NHÀ — Màn hình Đăng nhập Editorial, Đổi mật khẩu lần đầu & Chọn vai trò
 */
(function initAuthViews(global) {
  const { esc } = global.BanNha.utils;
  const { ROLE_LABELS } = global.BanNha.domain;
  const { icon, tribalStripe } = global.BanNha.icons;
  const { getAuthStatusSummary } = global.BanNha.authAdapter;

  const QUICK_ACCOUNTS = [
    { code: 'HS10A02', label: 'Học sinh (Nông Văn Toàn · 10A1)' },
    { code: 'HS10A01', label: 'Học sinh lần đầu (Giàng A Minh)' },
    { code: 'PH10A01', label: 'Phụ huynh 2 con (Giàng A Súa)' },
    { code: 'QS001', label: 'Quản sinh (Hà Văn Quân)' },
    { code: 'GV001', label: 'GVCN kiêm Quản sinh (Cô Hương)' },
    { code: 'YT001', label: 'Nhân viên Y tế (Y sĩ Thảo)' },
    { code: 'NB001', label: 'Nhà bếp (Cô Bích)' },
    { code: 'ADMIN01', label: 'Quản trị trường (Thầy Khánh)' },
  ];

  function renderLoginView(state, selectedCode = 'HS10A02', errorMsg = '') {
    const authSummary = getAuthStatusSummary();
    return `
      <div class="auth-stage">
        ${tribalStripe()}
        <div class="auth-split">
          <section class="auth-editorial reveal-up" style="--stagger: 0">
            <div class="stack-md">
              <button type="button" class="header-chip-btn" style="align-self:flex-start" data-nav="/">
                ← Trang giới thiệu
              </button>
              <h1 class="auth-editorial-title">Xa bản,<br /><em>vẫn có nhà.</em></h1>
              <p class="auth-editorial-lead">
                Đồng hành cùng học sinh dân tộc nội trú, thầy cô quản sinh và phụ huynh ở bản xa — trên cả những chiếc điện thoại cấu hình thấp, kể cả khi mất sóng.
              </p>
            </div>

            <div class="auth-live-bento">
              <div class="auth-bento-tile">
                <strong>Điểm danh QR ngoại tuyến</strong>
                <span>Quét thẻ phòng ở không cần sóng 4G, tự đồng bộ khi có mạng.</span>
              </div>
              <div class="auth-bento-tile">
                <strong>★ Sổ liên lạc & Gia sư tối</strong>
                <span>Phụ huynh xem tin con chữ lớn 18px; học sinh hỏi bài gợi mở từng bước.</span>
              </div>
              <div class="auth-bento-tile">
                <strong>Bếp ăn & Y tế học đường</strong>
                <span>Tự động cắt suất khi duyệt đơn về bản; nút giữ SOS 2 giây khẩn cấp.</span>
              </div>
            </div>
          </section>

          <section class="auth-panel reveal-up" style="--stagger: 1" aria-label="Đăng nhập tài khoản trường cấp">
            <div class="stack-sm">
              <h2 class="section-title">Đăng nhập bằng mã trường cấp</h2>
              <p class="text-muted">
                Trạng thái xác thực: <strong>${esc(authSummary)}</strong>
              </p>
            </div>

            <div class="auth-trial-cta">
              <div>
                <strong>Chưa có tài khoản?</strong>
                <p class="text-muted">Dùng thử ngay với dữ liệu mẫu, không cần mã hay mật khẩu.</p>
              </div>
              <button type="button" class="btn btn-accent btn-sm" data-action="start-trial" data-role="student">
                ${icon('play', 15)} Dùng thử
              </button>
            </div>

            ${errorMsg ? `<div class="alert alert-danger" role="alert">${esc(errorMsg)}</div>` : ''}

            <form class="stack-md" data-form="login">
              <div class="field">
                <label for="login-code">Mã học sinh / cán bộ / phụ huynh</label>
                <input
                  id="login-code"
                  name="code"
                  class="input"
                  value="${esc(selectedCode)}"
                  autocomplete="username"
                  required
                />
              </div>

              <div class="field">
                <label for="login-password">Mật khẩu</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  class="input"
                  value="MatKhau2026"
                  autocomplete="current-password"
                  required
                />
              </div>

              <button type="submit" class="btn btn-primary">
                <span>Vào ứng dụng BẢN NHÀ</span>
                <span class="btn-arrow">${icon('arrow', 18)}</span>
              </button>
            </form>

            <div class="card-sunken stack-sm">
              <p class="text-muted"><strong>Chọn nhanh tài khoản mẫu</strong> (mật khẩu mặc định <span class="code-pill">MatKhau2026</span>):</p>
              <div class="row-wrap">
                ${QUICK_ACCOUNTS.map(
                  (acc) => `
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    data-action="prefill-login"
                    data-code="${acc.code}"
                  >
                    ${esc(acc.label)}
                  </button>`,
                ).join('')}
              </div>
            </div>

            <div class="alert alert-info">
              <strong>Gợi ý cho đồng đội làm Auth:</strong> Mở <span class="code-pill">js/config.js</span> và <span class="code-pill">js/services/auth-adapter.js</span> — đã viết sẵn trọn bộ <strong>Supabase Auth</strong> & <strong>Firebase Auth</strong>, chỉ cần điền khóa là chạy thật.
            </div>
          </section>
        </div>
        ${tribalStripe()}
      </div>`;
  }

  function renderChangePasswordView(user, errorMsg = '') {
    return `
      <div class="auth-stage">
        ${tribalStripe()}
        <div class="auth-split" style="max-width:36rem;grid-template-columns:1fr">
          <section class="auth-panel reveal-up">
            <span class="chip chip-star">Bảo mật lần đăng nhập đầu tiên</span>
            <h1>Đổi mật khẩu riêng của ${esc(user.fullName)}</h1>
            <p class="text-muted">
              Để bảo vệ thông tin nội trú trên điện thoại dùng chung, bạn hãy đặt mật khẩu mới tối thiểu 8 ký tự gồm cả chữ và số.
            </p>
            ${errorMsg ? `<div class="alert alert-danger" role="alert">${esc(errorMsg)}</div>` : ''}
            <form class="stack-md" data-form="change-password">
              <div class="field">
                <label for="cp-current">Mật khẩu hiện tại trường cấp</label>
                <input id="cp-current" name="currentPassword" type="password" class="input" value="MatKhau2026" required />
              </div>
              <div class="field">
                <label for="cp-new">Mật khẩu mới (ít nhất 8 ký tự, có chữ và số)</label>
                <input id="cp-new" name="newPassword" type="password" class="input" placeholder="Ví dụ: BanNha2027" required />
              </div>
              <div class="row-wrap">
                <button type="submit" class="btn btn-primary">Lưu mật khẩu mới & Tiếp tục</button>
                <button type="button" class="btn btn-secondary" data-action="logout">Quay lại đăng nhập</button>
              </div>
            </form>
          </section>
        </div>
        ${tribalStripe()}
      </div>`;
  }

  function renderRolePickerView(user) {
    return `
      <div class="auth-stage">
        ${tribalStripe()}
        <div class="auth-split" style="max-width:42rem;grid-template-columns:1fr">
          <section class="auth-panel reveal-up">
            <span class="chip">Tài khoản kiêm nhiệm nhiều công tác</span>
            <h1>Chọn vai trò làm việc hôm nay</h1>
            <p class="text-muted">
              Xin chào <strong>${esc(user.fullName)}</strong>. Tài khoản của Thầy/Cô có ${user.roles.length} vai trò trong trường:
            </p>
            <div class="grid-2">
              ${user.roles
                .map(
                  (r, idx) => `
                <button
                  type="button"
                  class="card card-interactive reveal-up"
                  style="--stagger:${idx + 1}"
                  data-action="pick-role"
                  data-role="${r}"
                >
                  <div class="icon-box">${icon(r === 'teacher' ? 'contact' : 'dorm', 22)}</div>
                  <div class="stack-sm">
                    <h3>${esc(ROLE_LABELS[r] || r)}</h3>
                    <p class="text-muted">Chuyển sang bàn làm việc ${esc(ROLE_LABELS[r] || r)}.</p>
                  </div>
                </button>`,
                )
                .join('')}
            </div>
          </section>
        </div>
        ${tribalStripe()}
      </div>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.authViews = {
    renderLoginView,
    renderChangePasswordView,
    renderRolePickerView,
  };
})(window);
