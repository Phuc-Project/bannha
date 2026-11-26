/**
 * BẢN NHÀ — Khung ứng dụng thống nhất (Sidebar desktop, Topbar, BottomNav di động)
 */
(function initShell(global) {
  const { esc } = global.BanNha.utils;
  const { ROLE_LABELS } = global.BanNha.domain;
  const { icon } = global.BanNha.icons;
  const { CONFIG } = global.BanNha;

  const ROUTE_TITLES = {
    '/': 'Trang chủ',
    '/dorm': 'Ký túc xá số',
    '/kitchen': 'Bếp ăn minh bạch',
    '/contact': 'Sổ liên lạc Bản – Trường',
    '/tutor': 'Gia sư buổi tối',
    '/health': 'Y tế & Khẩn cấp SOS',
    '/donations': 'Ngân hàng đồ cũ',
    '/scholarships': 'Học bổng & Hướng nghiệp',
    '/culture': 'Kho văn hóa Bản tôi',
    '/admin': 'Quản trị nhà trường',
  };

  function getInitials(name) {
    const parts = String(name || 'BN')
      .trim()
      .split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function navItemsForRole(role) {
    switch (role) {
      case 'parent':
        return [
          { path: '/', label: 'Hôm nay', icon: 'home' },
          { path: '/contact', label: 'Sổ liên lạc', icon: 'contact' },
          { path: '/dorm', label: 'Xin phép', icon: 'dorm' },
          { path: '/kitchen', label: 'Thực đơn', icon: 'kitchen' },
          { path: '/health', label: 'Y tế', icon: 'health' },
        ];
      case 'dorm_staff':
        return [
          { path: '/', label: 'Tổng quan', icon: 'home' },
          { path: '/dorm', label: 'Ký túc xá', icon: 'dorm' },
          { path: '/kitchen', label: 'Suất ăn', icon: 'kitchen' },
          { path: '/donations', label: 'Đồ cũ', icon: 'donations' },
          { path: '/health', label: 'Y tế & SOS', icon: 'health' },
        ];
      case 'teacher':
        return [
          { path: '/', label: 'Tổng quan', icon: 'home' },
          { path: '/contact', label: 'Sổ liên lạc', icon: 'contact' },
          { path: '/dorm', label: 'Xin phép', icon: 'dorm' },
          { path: '/tutor', label: 'Bài tuần này', icon: 'tutor' },
          { path: '/culture', label: 'Kho văn hóa', icon: 'culture' },
        ];
      case 'medical_staff':
        return [
          { path: '/', label: 'Tổng quan', icon: 'home' },
          { path: '/health', label: 'Y tế & SOS', icon: 'health' },
          { path: '/dorm', label: 'Ký túc xá', icon: 'dorm' },
          { path: '/contact', label: 'Liên lạc PH', icon: 'contact' },
        ];
      case 'kitchen_staff':
        return [
          { path: '/', label: 'Tổng quan', icon: 'home' },
          { path: '/kitchen', label: 'Bếp ăn', icon: 'kitchen' },
          { path: '/dorm', label: 'Đơn về bản', icon: 'dorm' },
        ];
      case 'admin':
        return [
          { path: '/', label: 'Tổng quan', icon: 'home' },
          { path: '/admin', label: 'Tài khoản & QR', icon: 'admin' },
          { path: '/dorm', label: 'Ký túc xá', icon: 'dorm' },
          { path: '/kitchen', label: 'Bếp ăn', icon: 'kitchen' },
          { path: '/scholarships', label: 'Học bổng', icon: 'scholarships' },
        ];
      default:
        return [
          { path: '/', label: 'Hôm nay', icon: 'home' },
          { path: '/dorm', label: 'Ký túc xá', icon: 'dorm' },
          { path: '/kitchen', label: 'Bếp ăn', icon: 'kitchen' },
          { path: '/tutor', label: 'Gia sư', icon: 'tutor' },
          { path: '/health', label: 'Y tế', icon: 'health' },
        ];
    }
  }

  function sidebarGroupsForRole(role) {
    if (role === 'student') {
      return [
        {
          title: 'Sinh hoạt hằng ngày',
          items: [
            { path: '/', label: 'Hôm nay của em', icon: 'home' },
            { path: '/dorm', label: 'Ký túc xá số', icon: 'dorm' },
            { path: '/kitchen', label: 'Bếp ăn minh bạch', icon: 'kitchen' },
            { path: '/health', label: 'Y tế & Khẩn cấp SOS', icon: 'health' },
          ],
        },
        {
          title: 'Học tập & Kết nối',
          items: [
            { path: '/contact', label: 'Sổ liên lạc', icon: 'contact' },
            { path: '/tutor', label: 'Gia sư buổi tối', icon: 'tutor' },
            { path: '/scholarships', label: 'Học bổng & Hướng nghiệp', icon: 'scholarships' },
          ],
        },
        {
          title: 'Cộng đồng nội trú',
          items: [
            { path: '/donations', label: 'Ngân hàng đồ cũ', icon: 'donations' },
            { path: '/culture', label: 'Kho văn hóa Bản tôi', icon: 'culture' },
          ],
        },
      ];
    }
    return [{ title: 'Danh mục chức năng', items: navItemsForRole(role) }];
  }

  function renderSyncBadge(state) {
    const pending = state.outbox.length;
    if (!state.online) {
      return `<span class="sync-badge" data-state="offline"><span class="sync-dot"></span><span>Ngoại tuyến${pending > 0 ? ` (${pending} chờ gửi)` : ''}</span></span>`;
    }
    if (pending > 0) {
      return `<span class="sync-badge" data-state="pending"><span class="sync-dot"></span><span>Đang đồng bộ (${pending})</span></span>`;
    }
    return `<span class="sync-badge" data-state="synced"><span class="sync-dot"></span><span>Trực tuyến</span></span>`;
  }

  function wrapShell(state, currentRoute, innerHtml) {
    const user = global.BanNha.store.getCurrentUser();
    const role = state.session.activeRole || 'student';
    const bottomItems = navItemsForRole(role);
    const sideGroups = sidebarGroupsForRole(role);
    const isLarge = state.session.textSize === 'large';
    const pageTitle = ROUTE_TITLES[currentRoute] || 'BẢN NHÀ';

    const userSub =
      role === 'student' && user?.className
        ? `Lớp ${user.className} · Phòng ${user.room || '—'}`
        : ROLE_LABELS[role] || role;

    return `
      <div class="app-shell">
        <div class="app-layout">
          <aside class="sidebar-nav" aria-label="Điều hướng chính">
            <div class="stack-md">
              <button type="button" class="sidebar-brand" data-nav="/">
                <span class="brand-mark">${icon('home', 18)}</span>
                <span>
                  <span class="brand-name">BẢN NHÀ</span>
                  <span class="brand-school">${esc(CONFIG.schoolName)}</span>
                </span>
              </button>

              <div class="sidebar-user">
                <span class="user-avatar" aria-hidden="true">${esc(getInitials(user?.fullName))}</span>
                <div class="sidebar-user-meta">
                  <strong>${esc(user ? user.fullName : '')}</strong>
                  <span>${esc(userSub)}</span>
                </div>
              </div>

              ${sideGroups
                .map(
                  (grp) => `
                <div class="sidebar-group">
                  <div class="sidebar-section-label">${esc(grp.title)}</div>
                  ${grp.items
                    .map(
                      (it) => `
                    <button type="button" class="sidebar-btn" data-nav="${it.path}" ${currentRoute === it.path ? 'aria-current="page"' : ''}>
                      ${icon(it.icon, 18)}
                      <span>${esc(it.label)}</span>
                    </button>`,
                    )
                    .join('')}
                </div>`,
                )
                .join('')}
            </div>

            <div class="sidebar-footer">
              ${
                user && user.roles.length > 1
                  ? `<button type="button" class="sidebar-btn" data-nav="/chon-vai-tro">
                      ${icon('users', 18)}
                      <span>Đổi vai trò làm việc</span>
                    </button>`
                  : ''
              }
              <button type="button" class="sidebar-btn" data-action="logout">
                ${icon('login', 18)}
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>

          <div class="app-content-col">
            <header class="app-topbar">
              <div class="topbar-inner">
                <div class="topbar-left">
                  <button type="button" class="topbar-brand-mobile" data-nav="/">
                    <span class="brand-mark">${icon('home', 17)}</span>
                    <span>
                      <span class="brand-name">BẢN NHÀ</span>
                      <span class="brand-school">${esc(pageTitle)}</span>
                    </span>
                  </button>
                  <span class="topbar-title-desktop">${esc(pageTitle)}</span>
                </div>

                <div class="topbar-actions">
                  ${renderSyncBadge(state)}
                  <button
                    type="button"
                    class="topbar-btn"
                    data-action="toggle-text-size"
                    aria-pressed="${isLarge}"
                    title="Điều chỉnh cỡ chữ dễ đọc"
                  >
                    ${isLarge ? 'A- Chữ vừa' : 'A+ Chữ lớn'}
                  </button>
                  ${
                    user && user.roles.length > 1
                      ? `<button type="button" class="topbar-btn" data-nav="/chon-vai-tro">Đổi vai</button>`
                      : ''
                  }
                  <button type="button" class="topbar-btn" data-action="logout">Đăng xuất</button>
                </div>
              </div>
            </header>

            <main class="main-area" id="main-content">
              ${innerHtml}
            </main>

            <footer class="app-footer no-print">
              <div class="footer-inner">
                <span><strong>BẢN NHÀ</strong> · ${esc(CONFIG.schoolName)}</span>
                <span>Hệ thống hỗ trợ học sinh nội trú</span>
              </div>
            </footer>
          </div>
        </div>

        <nav class="bottom-nav" aria-label="Điều hướng di động">
          ${bottomItems
            .map(
              (it) => `
            <button type="button" class="bottom-nav-btn" data-nav="${it.path}" ${currentRoute === it.path ? 'aria-current="page"' : ''}>
              ${icon(it.icon, 19)}
              <span>${esc(it.label)}</span>
            </button>`,
            )
            .join('')}
        </nav>
      </div>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.shell = { wrapShell };
})(window);
