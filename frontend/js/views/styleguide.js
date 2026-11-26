/**
 * BẢN NHÀ — Trang kiểm định Hệ thống thiết kế & Trạng thái ghép nối (/dev/ui)
 */
(function initStyleguide(global) {
  const { esc } = global.BanNha.utils;
  const { tribalStripe } = global.BanNha.icons;
  const { CONFIG } = global.BanNha;

  const SWATCHES = [
    {
      token: '--color-forest-900',
      hex: '#163F33',
      ratio: '11.71:1 với trắng',
      usage: 'Header cố định, cột Editorial',
    },
    {
      token: '--color-forest-700',
      hex: '#1E5A47',
      ratio: '8.05:1 với trắng',
      usage: 'Nút hành động chính, trạng thái chọn',
    },
    {
      token: '--color-forest-50',
      hex: '#E8F0EC',
      ratio: '12.74:1 với chữ ink',
      usage: 'Nền ô icon, chip trạng thái',
    },
    {
      token: '--color-cream',
      hex: '#FAF6EE',
      ratio: '13.70:1 với chữ ink',
      usage: 'Nền giấy ấm dịu mắt buổi tối',
    },
    {
      token: '--color-clay-600',
      hex: '#B8431E',
      ratio: '5.44:1 trên trắng',
      usage: 'Tiêu đề phân mục 20px & điểm nhấn ★',
    },
    {
      token: '--color-turmeric',
      hex: '#E3B23C',
      ratio: '5.97:1 trên forest-900',
      usage: 'Viền card nổi bật ★ (cấm làm chữ nền sáng)',
    },
    {
      token: '--color-indigo-700',
      hex: '#2F3F7A',
      ratio: '9.42:1 với trắng',
      usage: 'Sắc chàm vải lanh — học bổng & giáo viên',
    },
    {
      token: '--color-rose-700',
      hex: '#9E2A40',
      ratio: '7.18:1 với trắng',
      usage: 'Hồng đất Y tế — tách biệt với đỏ khẩn cấp SOS',
    },
    {
      token: '--color-danger',
      hex: '#C62828',
      ratio: '5.62:1 với trắng',
      usage: 'Nút giữ SOS 2 giây, cảnh báo khẩn',
    },
  ];

  function renderStyleguideView(state) {
    const isLarge = state.session.textSize === 'large';
    return `
      <div class="auth-stage">
        ${tribalStripe()}
        <main class="main-area" style="max-width:74rem;margin:0 auto;width:100%">
          <div class="stack-lg">
            <div class="page-head reveal-up">
              <div class="stack-sm">
                <h1>Hệ thống thiết kế BẢN NHÀ (/dev/ui)</h1>
                <p class="text-muted">
                  Thuần HTML5 + CSS3 + JavaScript · Chuẩn tương phản WCAG AA · Nhịp chuyển động GPU Hallmark & Impeccable
                </p>
              </div>
              <div class="row-wrap">
                <button type="button" class="btn btn-secondary btn-sm" data-action="toggle-text-size">
                  ${isLarge ? 'Tắt chế độ Chữ lớn (16px)' : 'Bật chế độ Chữ lớn (18px)'}
                </button>
                <button type="button" class="btn btn-accent btn-sm" data-nav="/dang-ky">
                  Đăng ký ngay
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-nav="/">
                  Trang giới thiệu
                </button>
              </div>
            </div>

            <section class="card stack-md reveal-up" style="--stagger:1">
              <h2 class="section-title">1. Trạng thái sẵn sàng cho đồng đội ghép nối (Auth & AI API)</h2>
              <div class="grid-2">
                <div class="card-sunken stack-sm">
                  <span class="chip">Xác thực: Supabase Auth</span>
                  <p class="text-muted">
                    Tệp cần sửa: <span class="code-pill">frontend/js/config.js</span> và <span class="code-pill">frontend/js/services/auth-adapter.js</span>. Hỗ trợ sẵn cả <strong>Supabase Auth</strong> và <strong>Firebase Auth</strong>.
                  </p>
                </div>
                <div class="card-sunken stack-sm">
                  <span class="chip chip-star">Gia sư AI: Chế độ ${esc(CONFIG.aiTutor.mode)}</span>
                  <p class="text-muted">
                    Endpoint gọn nhẹ: <span class="code-pill">POST /api/v1/tutor/ask</span> hoặc điền trực tiếp URL/API Key nhỏ vào <span class="code-pill">CONFIG.aiTutor</span>.
                  </p>
                </div>
              </div>
            </section>

            <section class="stack-md reveal-up" style="--stagger:2">
              <h2 class="section-title">2. Bảng màu vùng cao OKLCH & Tương phản WCAG AA (≥ 4.5:1)</h2>
              <div class="grid-cards">
                ${SWATCHES.map(
                  (s) => `
                  <div class="card stack-sm">
                    <div style="height:3rem;border-radius:8px;background:${s.hex};border:1px solid var(--color-line)"></div>
                    <div class="row-between">
                      <strong>${esc(s.token)}</strong>
                      <span class="code-pill">${esc(s.hex)}</span>
                    </div>
                    <p class="text-muted">${esc(s.ratio)} · ${esc(s.usage)}</p>
                  </div>`,
                ).join('')}
              </div>
            </section>

            <section class="card stack-md reveal-up" style="--stagger:3">
              <h2 class="section-title">3. Thành phần tương tác & Chuyển động xúc giác (120ms / 240ms / 420ms)</h2>
              <div class="row-wrap">
                <button type="button" class="btn btn-primary">Nút hành động chính</button>
                <button type="button" class="btn btn-accent">Nút nhấn Đăng ký</button>
                <button type="button" class="btn btn-secondary">Nút thứ cấp</button>
                <button type="button" class="btn btn-danger">Cảnh báo khẩn</button>
                <span class="chip">Đã đồng bộ</span>
                <span class="chip chip-star">★ Điểm mới nổi bật</span>
                <span class="chip chip-indigo">Sắc chàm vùng cao</span>
              </div>
              <button type="button" class="sos-hold-btn" data-hold-sos="2000">
                <span class="hold-fill"></span>
                <span class="hold-label">Thử nhấn giữ 2 giây nút SOS (GPU scaleX mượt không giật khung hình)</span>
              </button>
            </section>
          </div>
        </main>
        ${tribalStripe()}
      </div>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.styleguide = { renderStyleguideView };
})(window);
