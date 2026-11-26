/**
 * BẢN NHÀ — Trang giới thiệu & cổng Dùng thử (không cần đăng nhập)
 * Mục tiêu duy nhất của trang: đưa người xem vào sản phẩm thật nhanh nhất.
 */
(function initLanding(global) {
  const { esc, makeQrToken } = global.BanNha.utils;
  const { icon, tribalStripe, ridge } = global.BanNha.icons;
  const { CONFIG } = global.BanNha;

  const TRIAL_ROLES = [
    {
      role: 'student',
      title: 'Học sinh nội trú',
      desc: 'Thẻ QR điểm danh, báo cắt suất ăn, hỏi Gia sư AI buổi tối, nút SOS giữ 2 giây.',
      icon: 'tutor',
      tone: 'tone-forest',
      toneVar: 'var(--color-forest-700)',
    },
    {
      role: 'parent',
      title: 'Phụ huynh ở bản',
      desc: 'Xem "Hôm nay của con" bằng chữ lớn: điểm danh, điểm số, sức khỏe, lịch về nhà.',
      icon: 'home',
      tone: 'icon-box-star',
      toneVar: 'var(--color-turmeric)',
    },
    {
      role: 'teacher',
      title: 'Giáo viên chủ nhiệm',
      desc: 'Nhập điểm nhanh, gửi thông báo tới phụ huynh, duyệt bài Kho văn hóa của lớp.',
      icon: 'contact',
      tone: 'tone-indigo',
      toneVar: 'var(--color-indigo-700)',
    },
    {
      role: 'dorm_staff',
      title: 'Quản sinh ký túc xá',
      desc: 'Quét thẻ QR cả khi mất sóng, duyệt đơn về bản — bếp tự cắt suất theo đơn.',
      icon: 'dorm',
      tone: 'tone-forest',
      toneVar: 'var(--color-forest-500)',
    },
    {
      role: 'medical_staff',
      title: 'Nhân viên y tế',
      desc: 'Nhận báo ốm từ phòng ở, theo dõi chiều cao – cân nặng, xử lý tín hiệu SOS.',
      icon: 'health',
      tone: 'tone-rose',
      toneVar: 'var(--color-rose-700)',
    },
    {
      role: 'kitchen_staff',
      title: 'Nhà bếp',
      desc: 'Bảng suất nấu từng bữa đã trừ học sinh nghỉ, đọc góp ý món ăn quê.',
      icon: 'kitchen',
      tone: 'tone-clay',
      toneVar: 'var(--color-clay-600)',
    },
    {
      role: 'admin',
      title: 'Quản trị nhà trường',
      desc: 'Nhập danh sách CSV có kiểm tra thử, in thẻ QR học sinh khổ A4 (8 thẻ/trang).',
      icon: 'admin',
      tone: 'tone-ink',
      toneVar: 'var(--color-ink)',
    },
  ];

  const MODULES = [
    {
      path: '/contact',
      title: '★ Sổ liên lạc Bản – Trường',
      desc: 'Phụ huynh xem điểm danh, kết quả học tập, lịch về nhà của con và nhận thông báo ngay trên app.',
      icon: 'contact',
      star: true,
      span: true,
    },
    {
      path: '/dorm',
      title: 'Ký túc xá số',
      desc: 'Điểm danh bằng mã QR, xin phép về bản online, báo hỏng đồ trong phòng.',
      icon: 'dorm',
      tone: 'tone-forest',
    },
    {
      path: '/kitchen',
      title: 'Bếp ăn minh bạch',
      desc: 'Thực đơn cả tuần, báo cắt suất khi về nhà, góp ý món ăn cho nhà bếp.',
      icon: 'kitchen',
      tone: 'tone-clay',
    },
    {
      path: '/health',
      title: 'Y tế học đường',
      desc: 'Báo ốm, theo dõi sức khỏe, nhắc lịch khám; nút SOS gọi quản sinh và y tế.',
      icon: 'health',
      tone: 'tone-rose',
    },
    {
      path: '/donations',
      title: 'Ngân hàng đồ cũ',
      desc: 'Luân chuyển sách giáo khoa, đồng phục, áo ấm mùa đông; gợi ý ghép cho – nhận.',
      icon: 'donations',
      tone: 'tone-forest',
    },
    {
      path: '/tutor',
      title: '★ Gia sư AI buổi tối',
      desc: 'Hỏi bài khi tự học, giải thích từng bước, tự ôn theo bài trên lớp.',
      icon: 'tutor',
      star: true,
      span: true,
    },
    {
      path: '/culture',
      title: '★ Kho văn hóa Bản tôi',
      desc: 'Học sinh giới thiệu trang phục, lễ hội, món ăn, phong tục của dân tộc mình.',
      icon: 'culture',
      star: true,
      span: true,
    },
    {
      path: '/scholarships',
      title: 'Học bổng & hướng nghiệp',
      desc: 'Tổng hợp học bổng, chính sách cử tuyển, nhắc hạn nộp hồ sơ, trắc nghiệm nghề.',
      icon: 'scholarships',
      tone: 'tone-indigo',
      span: true,
    },
  ];

  const check = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;

  function renderPreview() {
    const qrToken = makeQrToken(CONFIG.schoolId, 'HS10A02', 1);
    const items = [
      ['Điểm danh ký túc xá 20:30', 'Phòng A201 · quét thẻ QR khi mất sóng'],
      ['Báo cắt bữa tối Thứ Bảy', 'Về bản cùng gia đình · bếp đã nhận'],
      ['Hỏi Gia sư: đỉnh Parabol', 'Gợi ý bước 2 đã mở · còn 28 lượt'],
      ['Khám răng định kỳ 14:00', 'Phòng Y tế · Thứ Bảy'],
    ];
    return `
      <div class="hero-stage" aria-hidden="true">
        <div class="preview-card spot">
          <div class="preview-top">
            <span>BẢN NHÀ · Học sinh</span>
            <span class="preview-sync"><i></i><b class="ps-off">Ngoại tuyến · 2 chờ gửi</b><b class="ps-on">Đã đồng bộ</b></span>
          </div>
          <div class="preview-body">
            <p class="preview-greet">Thứ Năm, 26/11<strong>Việc hôm nay của em</strong></p>
            <ol class="preview-list">
              ${items
                .map(
                  ([t, s], i) => `
                <li style="--i:${i}">
                  <span class="pv-check">${check}</span>
                  <div><strong>${esc(t)}</strong><small>${esc(s)}</small></div>
                </li>`,
                )
                .join('')}
            </ol>
          </div>
        </div>

        <div class="preview-float pf-a">
          <span class="icon-box icon-box-star" style="width:2.2rem;height:2.2rem">${icon('home', 18)}</span>
          <div><strong>Tin cho phụ huynh</strong><span>Con đã điểm danh lúc 20:42</span></div>
        </div>
        <div class="preview-float pf-b">
          <div class="qr-mini" data-qr="${esc(qrToken)}"></div>
          <div><strong>Thẻ nội trú</strong><span>Ký số, kiểm tra không cần mạng</span></div>
        </div>
      </div>`;
  }

  function renderLandingView() {
    return `
      <div class="landing">
        ${tribalStripe()}
        <header class="landing-nav" data-scroll-header>
          <div class="l-container landing-nav-inner">
            <button type="button" class="landing-brand" data-action="scroll-to" data-target="top">
              <span class="brand-mark">${icon('home', 19)}</span>
              <span><strong>BẢN NHÀ</strong><small>Hỗ trợ học sinh dân tộc nội trú</small></span>
            </button>
            <nav class="landing-links" aria-label="Mục trên trang">
              <button type="button" data-action="scroll-to" data-target="thu-vai-tro">Dùng thử</button>
              <button type="button" data-action="scroll-to" data-target="chuc-nang">8 chức năng</button>
              <button type="button" data-action="scroll-to" data-target="cach-dung">Cách dùng</button>
            </nav>
            <div class="landing-nav-actions">
              <button type="button" class="btn btn-ghost btn-sm" data-nav="/dang-nhap">${icon('login', 16)} Đăng nhập</button>
              <button type="button" class="btn btn-primary btn-sm" data-action="start-trial" data-role="student">Dùng thử</button>
            </div>
          </div>
        </header>

        <main id="top">
          <section class="hero">
            <div class="l-container hero-grid">
              <div class="hero-copy">
                <p class="hero-kicker">Dành cho trường Phổ thông Dân tộc Nội trú vùng cao</p>
                <h1 class="hero-title">Xa bản,<br /><em>vẫn có nhà.</em></h1>
                <p class="hero-lead">
                  Một ứng dụng cho mọi việc của đời sống nội trú — điểm danh, bữa ăn, sổ liên lạc với bản, gia sư buổi tối. Vẫn dùng được khi mất sóng, chạy mượt trên điện thoại cấu hình thấp.
                </p>
                <div class="hero-cta">
                  <button type="button" class="btn btn-primary btn-lg" data-action="start-trial" data-role="student">
                    ${icon('play', 18)} Dùng thử ngay — không cần tài khoản
                  </button>
                  <button type="button" class="btn btn-secondary btn-lg" data-action="scroll-to" data-target="thu-vai-tro">
                    Chọn vai trò khác <span class="btn-arrow">${icon('arrow', 18)}</span>
                  </button>
                </div>
                <ul class="hero-facts">
                  <li>${icon('offline', 18)} Dùng được khi mất mạng</li>
                  <li>${icon('key', 18)} Một tài khoản cho cả trường</li>
                  <li>${icon('device', 18)} Nhẹ, chạy máy cấu hình thấp</li>
                </ul>
                <p class="hero-note">Bản dùng thử chạy bằng dữ liệu mẫu của một trường giả định · không lưu lại sau khi thoát.</p>
              </div>
              ${renderPreview()}
            </div>
            ${ridge('#E3ECE6', '#F3EDE0')}
          </section>

          <section class="l-section reveal" style="padding-top:2.5rem">
            <div class="l-container">
              <div class="section-head">
                <h2>Học sinh nội trú đang gặp gì?</h2>
              </div>
              <div class="pains-grid">
                <article class="pain reveal" style="--stagger:1">
                  <span class="pain-num">01</span>
                  <h3>Xa gia đình</h3>
                  <p>Ở trường cả tuần, phụ huynh ở bản ít nắm được tình hình học tập, sinh hoạt của con.</p>
                </article>
                <article class="pain reveal" style="--stagger:2">
                  <span class="pain-num">02</span>
                  <h3>Thiếu điều kiện</h3>
                  <p>Nhiều em khó khăn, thiếu sách vở, đồng phục, áo ấm; tự học buổi tối không có người hỏi bài.</p>
                </article>
                <article class="pain reveal" style="--stagger:3">
                  <span class="pain-num">03</span>
                  <h3>Quản lý thủ công</h3>
                  <p>Điểm danh, xin phép, báo cắt suất ăn vẫn làm bằng sổ sách, giấy tờ.</p>
                </article>
              </div>
            </div>
          </section>

          <section id="thu-vai-tro" class="l-section reveal">
            <div class="l-container">
              <div class="section-head">
                <h2>Thử ngay bằng vai trò của bạn</h2>
                <p>Mỗi vai trò mở đúng màn hình người đó dùng hằng ngày. Không cần mã, không cần mật khẩu — bấm là vào.</p>
              </div>
              <div class="roles-wrap">
                <ol class="role-list">
                  ${TRIAL_ROLES.map(
                    (r, i) => `
                    <li>
                      <button type="button" class="role-row" style="--tone:${r.toneVar}" data-action="start-trial" data-role="${r.role}">
                        <span class="role-num">${String(i + 1).padStart(2, '0')}</span>
                        <span class="icon-box ${r.tone}">${icon(r.icon, 21)}</span>
                        <span class="role-body"><strong>${esc(r.title)}</strong><span>${esc(r.desc)}</span></span>
                        <span class="role-go"><span class="role-go-label">Thử vai này</span><span class="btn-arrow">${icon('arrow', 18)}</span></span>
                      </button>
                    </li>`,
                  ).join('')}
                </ol>
              </div>
            </div>
          </section>

          <section id="chuc-nang" class="l-section reveal">
            <div class="l-container">
              <div class="section-head">
                <h2>8 chức năng trong một ứng dụng</h2>
                <span class="chip chip-star">★ điểm mới nổi bật</span>
              </div>
              <div class="bento">
                ${MODULES.map(
                  (m, i) => `
                  <button
                    type="button"
                    class="card card-interactive bento-tile ${m.star ? 'card-star' : ''} ${m.span ? 'span-2' : ''} reveal"
                    style="--stagger:${i % 4}"
                    data-action="start-trial"
                    data-role="student"
                    data-goto="${m.path}"
                  >
                    <span class="icon-box ${m.star ? 'icon-box-star' : m.tone}">${icon(m.icon, 22)}</span>
                    <span class="stack-sm">
                      <h3>${esc(m.title)}</h3>
                      <span class="text-muted">${esc(m.desc)}</span>
                    </span>
                    <span class="bento-try">Mở thử <span class="btn-arrow">${icon('arrow', 16)}</span></span>
                  </button>`,
                ).join('')}
              </div>
            </div>
          </section>

          <section id="cach-dung" class="l-section reveal">
            <div class="l-container">
              <div class="section-head">
                <h2>Cách dùng</h2>
                <p>Trường cấp sẵn tài khoản cho từng người — không cần email hay số điện thoại.</p>
              </div>
              <ol class="steps-list">
                <li class="step reveal" style="--stagger:0"><strong>Đăng nhập</strong><span>Bằng mã tài khoản trường cấp, đổi mật khẩu ở lần đầu.</span></li>
                <li class="step reveal" style="--stagger:1"><strong>Chọn vai trò</strong><span>Học sinh, giáo viên, phụ huynh — mỗi người một màn hình riêng.</span></li>
                <li class="step reveal" style="--stagger:2"><strong>Dùng mọi chức năng</strong><span>Kể cả khi mất mạng: mọi thao tác được lưu ngay trên máy.</span></li>
                <li class="step reveal" style="--stagger:3"><strong>Tự đồng bộ khi có sóng</strong><span>Đơn từ, điểm danh tự gửi lên trường, không mất dữ liệu.</span></li>
              </ol>
            </div>
          </section>

          <section class="l-section reveal" style="padding-top:1rem">
            <div class="l-container">
              <div class="cta-band">
                <h2>Mở thử trong <em>một chạm.</em></h2>
                <p>Bắt đầu với vai học sinh, đổi sang phụ huynh hay quản sinh bất cứ lúc nào ngay trên thanh dùng thử.</p>
                <div class="hero-cta">
                  <button type="button" class="btn btn-accent btn-lg" data-action="start-trial" data-role="student">${icon('play', 18)} Dùng thử ngay</button>
                  <button type="button" class="btn btn-secondary btn-lg" data-nav="/dang-nhap">Tôi có tài khoản trường cấp</button>
                </div>
                ${ridge('#1E5A47', '#1A4D3E')}
              </div>
            </div>
          </section>
        </main>

        <footer class="app-footer">
          ${tribalStripe()}
          <div class="footer-inner">
            <span><strong>BẢN NHÀ</strong> — Xa bản, vẫn có nhà.</span>
            <button type="button" class="btn btn-ghost btn-sm" data-nav="/dev/ui">Hệ thống thiết kế</button>
          </div>
        </footer>
      </div>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.landing = { renderLandingView, TRIAL_ROLES };
})(window);
