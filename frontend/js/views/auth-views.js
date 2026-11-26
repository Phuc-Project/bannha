/**
 * BẢN NHÀ — Màn hình Đăng nhập, Đăng ký, Đổi mật khẩu lần đầu & Chọn vai trò
 */
(function initAuthViews(global) {
  const { esc } = global.BanNha.utils;
  const { ROLE_LABELS } = global.BanNha.domain;
  const { icon } = global.BanNha.icons;
  const { CONFIG } = global.BanNha;

  function renderAuthTopbar() {
    return `
      <header class="auth-topbar">
        <div class="auth-topbar-inner">
          <button type="button" class="landing-brand" data-nav="/">
            <span class="brand-mark">${icon('home', 18)}</span>
            <span>
              <strong>BẢN NHÀ</strong>
              <small>${esc(CONFIG.schoolName)}</small>
            </span>
          </button>
          <button type="button" class="btn btn-ghost btn-sm" data-nav="/">
            Về trang giới thiệu
          </button>
        </div>
      </header>`;
  }

  function renderLoginView(_state, selectedCode = '', errorMsg = '') {
    return `
      <div class="auth-stage">
        ${renderAuthTopbar()}
        <main class="auth-center">
          <div class="auth-split">
            <section class="auth-intro">
              <div class="stack-md">
                <span class="chip" style="align-self:flex-start;background:rgb(255 255 255 / 0.14);color:#fff">
                  Cổng thông tin nội trú
                </span>
                <h1>Xa bản, vẫn có nhà.</h1>
                <p class="auth-intro-lead">
                  Đăng nhập để theo dõi điểm danh, bữa ăn, kết quả học tập và liên lạc giữa bản với trường.
                </p>
              </div>

              <ul class="auth-feature-list">
                <li>
                  <span>${icon('qr', 18)}</span>
                  <div>
                    <strong>Điểm danh và xin phép thuận tiện</strong>
                    Quét thẻ nội trú nhanh gọn, tự động liên thông cắt suất với nhà bếp.
                  </div>
                </li>
                <li>
                  <span>${icon('contact', 18)}</span>
                  <div>
                    <strong>Phụ huynh dễ theo dõi con từ xa</strong>
                    Hỗ trợ chế độ chữ lớn, cập nhật điểm số và thông báo của giáo viên chủ nhiệm.
                  </div>
                </li>
                <li>
                  <span>${icon('offline', 18)}</span>
                  <div>
                    <strong>An toàn khi dùng điện thoại chung</strong>
                    Tự động xóa dữ liệu trên máy khi đăng xuất.
                  </div>
                </li>
              </ul>
            </section>

            <section class="auth-panel" aria-label="Biểu mẫu đăng nhập">
              <div class="stack-sm">
                <h2>Đăng nhập tài khoản</h2>
                <p class="text-muted">Nhập tên đăng nhập và mật khẩu bạn đã đăng ký.</p>
              </div>

              ${errorMsg ? `<div class="alert alert-danger" role="alert">${esc(errorMsg)}</div>` : ''}

              <form class="stack-md" data-form="login">
                <div class="field">
                  <label for="login-code">Tên đăng nhập</label>
                  <input
                    id="login-code"
                    name="code"
                    class="input"
                    value="${esc(selectedCode)}"
                    placeholder="Ví dụ: phuc2010"
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
                    placeholder="Nhập mật khẩu của bạn"
                    autocomplete="current-password"
                    required
                  />
                </div>

                <button type="submit" class="btn btn-primary btn-block">
                  Đăng nhập
                </button>
              </form>

              <div class="card-sunken">
                <p class="text-muted">
                  Chưa có tài khoản? Học sinh và phụ huynh tự đăng ký trong 1 phút. Thầy cô và nhân viên dùng tài khoản nhà trường cấp.
                </p>
                <button type="button" class="btn btn-secondary btn-block" data-nav="/dang-ky">Đăng ký tài khoản mới</button>
              </div>
            </section>
          </div>
        </main>
      </div>`;
  }

  function renderRegisterView(errorMsg = '', draft = {}) {
    const role = draft.role === 'parent' ? 'parent' : 'student';
    return `
      <div class="auth-stage">
        ${renderAuthTopbar()}
        <main class="auth-center">
          <section class="auth-panel auth-panel-single" aria-label="Biểu mẫu đăng ký">
            <div class="stack-sm">
              <h1>Đăng ký tài khoản</h1>
              <p class="text-muted">Dành cho học sinh và phụ huynh. Tài khoản thầy cô và nhân viên do nhà trường cấp.</p>
            </div>

            ${errorMsg ? `<div class="alert alert-danger" role="alert">${esc(errorMsg)}</div>` : ''}

            <form class="stack-md" data-form="register">
              <div class="field">
                <label for="rg-role">Bạn là</label>
                <select id="rg-role" name="role" class="select">
                  <option value="student" ${role === 'student' ? 'selected' : ''}>Học sinh</option>
                  <option value="parent" ${role === 'parent' ? 'selected' : ''}>Phụ huynh</option>
                </select>
              </div>
              <div class="field">
                <label for="rg-name">Họ và tên</label>
                <input id="rg-name" name="fullName" class="input" value="${esc(draft.fullName || '')}"
                  autocomplete="name" minlength="2" maxlength="120" required />
              </div>
              <div class="field">
                <label for="rg-eth">Dân tộc (không bắt buộc)</label>
                <input id="rg-eth" name="ethnicity" class="input" value="${esc(draft.ethnicity || '')}" maxlength="40" />
              </div>
              <div class="field">
                <label for="rg-user">Tên đăng nhập</label>
                <input id="rg-user" name="username" class="input" value="${esc(draft.username || '')}"
                  autocomplete="username" autocapitalize="none" spellcheck="false"
                  pattern="[A-Za-z]{2,6}[0-9]{2,6}" placeholder="Ví dụ: phuc2010" required />
                <p class="text-muted">2–6 chữ cái không dấu, rồi 2–6 chữ số.</p>
              </div>
              <div class="field">
                <label for="rg-pw">Mật khẩu</label>
                <input id="rg-pw" name="password" type="password" class="input" minlength="8"
                  placeholder="Ít nhất 8 ký tự, gồm cả chữ và số" autocomplete="new-password" required />
              </div>
              <div class="field">
                <label for="rg-pw2">Nhập lại mật khẩu</label>
                <input id="rg-pw2" name="password2" type="password" class="input" minlength="8"
                  autocomplete="new-password" required />
              </div>
              <button type="submit" class="btn btn-primary btn-block">Tạo tài khoản</button>
            </form>

            <p class="text-muted">
              Đã có tài khoản?
              <button type="button" class="btn btn-ghost btn-sm" data-nav="/dang-nhap">Đăng nhập</button>
            </p>
          </section>
        </main>
      </div>`;
  }

  function renderChangePasswordView(user, errorMsg = '') {
    return `
      <div class="auth-stage">
        ${renderAuthTopbar()}
        <main class="auth-center">
          <section class="auth-panel auth-panel-single">
            <div class="stack-sm">
              <span class="chip" style="align-self:flex-start">Bảo mật lần đăng nhập đầu tiên</span>
              <h1>Đổi mật khẩu mới</h1>
              <p class="text-muted">
                Chào <strong>${esc(user.fullName)}</strong>. Hãy đặt mật khẩu riêng có ít nhất 8 ký tự gồm cả chữ và số để bảo vệ tài khoản của bạn.
              </p>
            </div>

            ${errorMsg ? `<div class="alert alert-danger" role="alert">${esc(errorMsg)}</div>` : ''}

            <form class="stack-md" data-form="change-password">
              <div class="field">
                <label for="cp-current">Mật khẩu hiện tại</label>
                <input
                  id="cp-current"
                  name="currentPassword"
                  type="password"
                  class="input"
                  placeholder="Nhập mật khẩu trường đã cấp"
                  autocomplete="current-password"
                  required
                />
              </div>
              <div class="field">
                <label for="cp-new">Mật khẩu mới</label>
                <input
                  id="cp-new"
                  name="newPassword"
                  type="password"
                  class="input"
                  placeholder="Ít nhất 8 ký tự, gồm cả chữ và số"
                  autocomplete="new-password"
                  required
                />
              </div>
              <div class="row-wrap">
                <button type="submit" class="btn btn-primary">Lưu mật khẩu mới</button>
                <button type="button" class="btn btn-secondary" data-action="logout">Quay lại</button>
              </div>
            </form>
          </section>
        </main>
      </div>`;
  }

  function renderRolePickerView(user) {
    return `
      <div class="auth-stage">
        ${renderAuthTopbar()}
        <main class="auth-center">
          <section class="auth-panel auth-panel-single" style="max-width:40rem">
            <div class="stack-sm">
              <span class="chip" style="align-self:flex-start">Tài khoản kiêm nhiệm</span>
              <h1>Chọn vai trò làm việc</h1>
              <p class="text-muted">
                Xin chào <strong>${esc(user.fullName)}</strong>. Chọn công tác bạn muốn thực hiện ngay bây giờ:
              </p>
            </div>
            <div class="grid-2">
              ${user.roles
                .map(
                  (r) => `
                <button
                  type="button"
                  class="card card-interactive"
                  data-action="pick-role"
                  data-role="${r}"
                >
                  <span class="icon-box tone-brand">${icon(r === 'teacher' ? 'contact' : 'dorm', 20)}</span>
                  <div class="stack-sm">
                    <h3>${esc(ROLE_LABELS[r] || r)}</h3>
                    <p class="text-muted">Mở giao diện ${esc(ROLE_LABELS[r] || r)}.</p>
                  </div>
                </button>`,
                )
                .join('')}
            </div>
          </section>
        </main>
      </div>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.authViews = {
    renderLoginView,
    renderRegisterView,
    renderChangePasswordView,
    renderRolePickerView,
  };
})(window);
