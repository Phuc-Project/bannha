/**
 * BẢN NHÀ — Khung ứng dụng (Header cố định, Thanh dùng thử, Sidebar ≥768px, BottomNav <768px, Footer)
 */
(function initShell(global) {
  const { esc } = global.BanNha.utils;
  const { ROLE_LABELS } = global.BanNha.domain;
  const { icon, tribalStripe } = global.BanNha.icons;
  const { CONFIG } = global.BanNha;

  function navItemsForRole(role) {
    switch (role) {
      case 'parent':
        return [
          { path: '/', label: 'Con hôm nay', icon: 'home' },
          { path: '/contact', label: 'Sổ liên lạc', icon: 'contact' },
          { path: '/dorm', label: 'Xin phép', icon: 'dorm' },
          { path: '/kitchen', label: 'Thực đơn', icon: 'kitchen' },
          { path: '/health', label: 'Y tế', icon: 'health' },
        ];
      case 'dorm_staff':
        return [
          { path: '/', label: 'Trực KTX', icon: 'home' },
          { path: '/dorm', label: 'Điểm danh QR', icon: 'dorm' },
          { path: '/donations', label: 'Đồ cũ', icon: 'donations' },
          { path: '/health', label: 'Y tế & SOS', icon: 'health' },
          { path: '/kitchen', label: 'Suất bếp', icon: 'kitchen' },
        ];
      case 'teacher':
        return [
          { path: '/', label: 'Lớp chủ nhiệm', icon: 'home' },
          { path: '/contact', label: 'Sổ liên lạc', icon: 'contact' },
          { path: '/dorm', label: 'Đơn xin phép', icon: 'dorm' },
          { path: '/tutor', label: 'Chủ đề tuần', icon: 'tutor' },
          { path: '/culture', label: 'Duyệt bài', icon: 'culture' },
        ];
      case 'medical_staff':
        return [
          { path: '/', label: 'Phòng Y tế', icon: 'home' },
          { path: '/health', label: 'Hồ sơ & SOS', icon: 'health' },
          { path: '/dorm', label: 'Ký túc xá', icon: 'dorm' },
          { path: '/contact', label: 'Liên lạc PH', icon: 'contact' },
        ];
      case 'kitchen_staff':
        return [
          { path: '/', label: 'Ca bếp hôm nay', icon: 'home' },
          { path: '/kitchen', label: 'Suất ăn', icon: 'kitchen' },
          { path: '/dorm', label: 'HS về bản', icon: 'dorm' },
        ];
      case 'admin':
        return [
          { path: '/', label: 'Tổng quan', icon: 'home' },
          { path: '/admin', label: 'Tài khoản & QR', icon: 'admin' },
          { path: '/dorm', label: 'Ký túc xá', icon: 'dorm' },
          { path: '/kitchen', label: 'Nhà bếp', icon: 'kitchen' },
          { path: '/scholarships', label: 'Học bổng', icon: 'scholarships' },
        ];
      default:
        return [
          { path: '/', label: 'Hôm nay', icon: 'home' },
          { path: '/dorm', label: 'Ký túc xá', icon: 'dorm' },
          { path: '/kitchen', label: 'Bếp ăn', icon: 'kitchen' },
          { path: '/tutor', label: 'Gia sư AI', icon: 'tutor' },
          { path: '/health', label: 'Y tế & SOS', icon: 'health' },
        ];
    }
  }

  function fullSidebarItemsForStudent() {
    return [
      { path: '/', label: 'Việc hôm nay', icon: 'home' },
      { path: '/dorm', label: 'Ký túc xá số', icon: 'dorm' },
      { path: '/kitchen', label: 'Bếp ăn minh bạch', icon: 'kitchen' },
      { path: '/contact', label: '★ Sổ liên lạc', icon: 'contact' },
      { path: '/tutor', label: '★ Gia sư AI buổi tối', icon: 'tutor' },
      { path: '/health', label: 'Y tế & SOS', icon: 'health' },
      { path: '/donations', label: 'Ngân hàng đồ cũ', icon: 'donations' },
      { path: '/scholarships', label: 'Học bổng & Nghề', icon: 'scholarships' },
      { path: '/culture', label: '★ Kho văn hóa', icon: 'culture' },
    ];
  }

  function renderSyncBadge(state) {
    const pending = state.outbox.length;
    if (!state.online) {
      return `<span class="sync-badge" data-state="offline"><span class="sync-dot"></span><span>Đang ngoại tuyến${pending > 0 ? ` · ${pending} chờ gửi` : ''}</span></span>`;
    }
    if (pending > 0) {
      return `<span class="sync-badge" data-state="pending"><span class="sync-dot"></span><span>Đang đồng bộ (${pending})</span></span>`;
    }
    return `<span class="sync-badge" data-state="synced"><span class="sync-dot"></span><span>Đã đồng bộ</span></span>`;
  }

  function renderTrialBar(state) {
    const roles = global.BanNha.landing.TRIAL_ROLES;
    const current = state.session.activeRole;
    return `
      <div class="trial-bar no-print" role="region" aria-label="Bản dùng thử">
        <div class="trial-inner">
          <span class="trial-dot" aria-hidden="true"></span>
          <p><strong>Bản dùng thử</strong> · dữ liệu mẫu, mọi thao tác chỉ lưu tạm và tự xóa khi thoát.</p>
          <label class="trial-switch">
            <span>Xem với vai</span>
            <select class="select select-sm" data-change="trial-role" aria-label="Đổi vai trò dùng thử">
              ${roles
                .map(
                  (r) =>
                    `<option value="${r.role}" ${r.role === current ? 'selected' : ''}>${esc(r.title)}</option>`,
                )
                .join('')}
            </select>
          </label>
          <button type="button" class="btn btn-secondary btn-sm" data-nav="/dang-nhap">${icon('login', 15)} Đăng nhập thật</button>
        </div>
      </div>`;
  }

  function wrapShell(state, currentRoute, innerHtml) {
    const user = global.BanNha.store.getCurrentUser();
    const role = state.session.activeRole || 'student';
    const isGuest = Boolean(state.session.guest);
    const bottomItems = navItemsForRole(role);
    const sideItems = role === 'student' ? fullSidebarItemsForStudent() : bottomItems;
    const isLarge = state.session.textSize === 'large';

    return `
      <div class="app-shell">
        <header class="app-header" data-scroll-header>
          ${tribalStripe()}
          <div class="header-inner">
            <button type="button" class="brand-link" data-nav="/">
              <span class="brand-mark">${icon('home', 19)}</span>
              <span>
                <span class="brand-name">BẢN NHÀ</span>
                <span class="brand-school">${esc(CONFIG.schoolName)}</span>
              </span>
            </button>

            <div class="header-actions">
              ${renderSyncBadge(state)}
              <button type="button" class="header-chip-btn" data-action="toggle-online">
                ${icon('offline', 15)} ${state.online ? 'Thử offline' : 'Bật sóng'}
              </button>
              <button type="button" class="header-chip-btn" data-action="toggle-text-size" aria-pressed="${isLarge}">
                ${isLarge ? 'Chữ chuẩn' : 'Chữ lớn'}
              </button>
              ${
                !isGuest && user && user.roles.length > 1
                  ? `<button type="button" class="header-chip-btn" data-nav="/chon-vai-tro">Đổi vai trò</button>`
                  : ''
              }
              ${
                isGuest
                  ? `<button type="button" class="header-chip-btn" data-accent="true" data-action="exit-trial">Thoát dùng thử</button>`
                  : `<button type="button" class="header-chip-btn" data-action="logout">Thoát</button>`
              }
            </div>
          </div>
        </header>

        ${isGuest ? renderTrialBar(state) : ''}

        <div class="shell-body">
          <aside class="sidebar-nav" aria-label="Điều hướng chính">
            <div class="sidebar-group">
              <div class="sidebar-label">
                <strong style="color:var(--color-ink)">${esc(user ? user.fullName : '')}</strong><br />${esc(ROLE_LABELS[role] || role)}
              </div>
              ${sideItems
                .map(
                  (it) => `
                <button type="button" class="sidebar-btn" data-nav="${it.path}" ${currentRoute === it.path ? 'aria-current="page"' : ''}>
                  ${icon(it.icon, 19)}
                  <span>${esc(it.label)}</span>
                </button>`,
                )
                .join('')}
            </div>
            <div class="sidebar-group">
              <button type="button" class="sidebar-btn" data-nav="/dev/ui">
                ${icon('admin', 18)}
                <span>Hệ thống thiết kế</span>
              </button>
            </div>
          </aside>

          <main class="main-area" id="main-content">
            ${innerHtml}
          </main>
        </div>

        <nav class="bottom-nav" aria-label="Điều hướng di động">
          ${bottomItems
            .map(
              (it) => `
            <button type="button" class="bottom-nav-btn" data-nav="${it.path}" ${currentRoute === it.path ? 'aria-current="page"' : ''}>
              ${icon(it.icon, 20)}
              <span>${esc(it.label)}</span>
            </button>`,
            )
            .join('')}
        </nav>

        <footer class="app-footer">
          ${tribalStripe()}
          <div class="footer-inner">
            <span><strong>BẢN NHÀ</strong> — Xa bản, vẫn có nhà. Dùng tốt ngay cả khi mất mạng.</span>
            <span>${isGuest ? 'Đang ở chế độ dùng thử' : esc(CONFIG.schoolName)}</span>
          </div>
        </footer>
      </div>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.shell = { wrapShell };
})(window);
