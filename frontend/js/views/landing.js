/**
 * BẢN NHÀ — Trang giới thiệu ứng dụng hỗ trợ học sinh dân tộc nội trú
 */
(function initLanding(global) {
  const { esc } = global.BanNha.utils;
  const { icon, brandLogo } = global.BanNha.icons;
  const { CONFIG } = global.BanNha;

  const ROLES = [
    {
      role: 'student',
      title: 'Học sinh nội trú',
      desc: 'Xem thẻ QR điểm danh, thực đơn tuần, báo cắt suất ăn, hỏi Gia sư buổi tối và gửi báo ốm hoặc SOS.',
      icon: 'tutor',
      tone: 'tone-brand',
    },
    {
      role: 'parent',
      title: 'Phụ huynh ở bản',
      desc: 'Giao diện chữ lớn dễ đọc: theo dõi điểm danh hằng ngày, kết quả học tập, sức khỏe và xin phép cho con.',
      icon: 'home',
      tone: 'tone-amber',
    },
    {
      role: 'teacher',
      title: 'Giáo viên chủ nhiệm',
      desc: 'Cập nhật điểm môn học, gửi thông báo về bản cho phụ huynh và duyệt bài viết Kho văn hóa.',
      icon: 'contact',
      tone: 'tone-sky',
    },
    {
      role: 'dorm_staff',
      title: 'Quản sinh ký túc xá',
      desc: 'Điểm danh phòng bằng mã QR khi không có mạng, duyệt đơn xin về bản và theo dõi sửa chữa phòng.',
      icon: 'dorm',
      tone: 'tone-teal',
    },
    {
      role: 'medical_staff',
      title: 'Nhân viên y tế',
      desc: 'Tiếp nhận báo ốm từ phòng ở, theo dõi chiều cao cân nặng định kỳ và nhận tín hiệu SOS khẩn cấp.',
      icon: 'health',
      tone: 'tone-rose',
    },
    {
      role: 'kitchen_staff',
      title: 'Cán bộ nhà bếp',
      desc: 'Xem bảng quân số nấu ăn từng bữa đã tự động trừ học sinh nghỉ, đọc góp ý món ăn của học sinh.',
      icon: 'kitchen',
      tone: 'tone-amber',
    },
    {
      role: 'admin',
      title: 'Quản trị nhà trường',
      desc: 'Quản lý danh bạ tài khoản đầu năm học từ tệp CSV và in thẻ QR nội trú chuẩn khổ giấy A4.',
      icon: 'admin',
      tone: 'tone-ink',
    },
  ];

  const LIFE_MODULES = [
    {
      title: 'Ký túc xá số',
      desc: 'Điểm danh bằng mã QR, gửi đơn xin phép về bản và báo hỏng đồ đạc trong phòng ở.',
      icon: 'dorm',
      tone: 'tone-brand',
    },
    {
      title: 'Bếp ăn minh bạch',
      desc: 'Thực đơn cả tuần rõ ràng, báo cắt suất ăn khi về nhà và góp ý món ăn cho nhà bếp.',
      icon: 'kitchen',
      tone: 'tone-amber',
    },
    {
      title: 'Y tế & Khẩn cấp SOS',
      desc: 'Báo ốm tại phòng, theo dõi sức khỏe định kỳ và nút giữ SOS 2 giây khi khẩn cấp ban đêm.',
      icon: 'health',
      tone: 'tone-rose',
    },
    {
      title: 'Ngân hàng đồ cũ',
      desc: 'Chia sẻ sách giáo khoa, đồng phục, áo ấm mùa đông ẩn danh và giữ kín cho người nhận.',
      icon: 'donations',
      tone: 'tone-teal',
    },
  ];

  const STUDY_MODULES = [
    {
      title: 'Sổ liên lạc Bản – Trường',
      desc: 'Phụ huynh xem điểm danh, điểm học kỳ và thông báo trực tiếp từ giáo viên chủ nhiệm.',
      icon: 'contact',
      tone: 'tone-sky',
    },
    {
      title: 'Gia sư buổi tối',
      desc: 'Hỗ trợ tự học bằng câu hỏi gợi mở từng bước và bộ câu hỏi ôn tập theo bài trên lớp.',
      icon: 'tutor',
      tone: 'tone-brand',
    },
    {
      title: 'Học bổng & Hướng nghiệp',
      desc: 'Tổng hợp học bổng, chính sách cử tuyển, nhắc hạn nộp hồ sơ và khảo sát nhóm ngành nghề.',
      icon: 'scholarships',
      tone: 'tone-sky',
    },
    {
      title: 'Kho văn hóa Bản tôi',
      desc: 'Không gian để học sinh giới thiệu trang phục, món ăn và lễ hội truyền thống dân tộc mình.',
      icon: 'culture',
      tone: 'tone-amber',
    },
  ];

  function renderPreview() {
    const items = [
      ['Điểm danh phòng A201 lúc 20:30', 'Quét mã QR thẻ nội trú'],
      ['Bữa tối: Gà đồi kho sả ớt, canh bí đỏ', 'Hạn báo cắt suất ăn trước 15:30'],
      ['Tự học Toán 10: Hàm số bậc hai', 'Gia sư gợi ý từng bước và 5 câu tự luyện'],
      ['Lịch khám răng định kỳ', '14:00 Thứ Bảy tại Phòng Y tế trường'],
    ];

    return `
      <div class="preview-frame" aria-hidden="true">
        <div class="preview-top">
          <span>BẢN NHÀ · Học sinh</span>
          <span class="preview-status"><i></i>Đang trực tuyến</span>
        </div>
        <div class="preview-body">
          <div class="preview-student">
            <div>
              <strong>Lịch sinh hoạt nội trú</strong>
              <span>${esc(CONFIG.schoolName)}</span>
            </div>
            <span class="chip">Hôm nay</span>
          </div>
          <ol class="preview-list">
            ${items
              .map(
                ([title, sub]) => `
              <li>
                <span class="pv-check">${icon('check', 12)}</span>
                <div>
                  <strong>${esc(title)}</strong>
                  <small>${esc(sub)}</small>
                </div>
              </li>`,
              )
              .join('')}
          </ol>
        </div>
        <div class="preview-foot">
          <span>Phụ huynh ở bản nắm tình hình của con mỗi ngày.</span>
        </div>
      </div>`;
  }

  function renderLandingView() {
    return `
      <div class="landing">
        <header class="landing-nav">
          <div class="l-container landing-nav-inner">
            <button type="button" class="landing-brand" data-action="scroll-to" data-target="top">
              <span class="brand-mark">${brandLogo(38)}</span>
              <span>
                <strong>BẢN NHÀ</strong>
                <small>Đồng hành học sinh dân tộc nội trú</small>
              </span>
            </button>

            <nav class="landing-links" aria-label="Điều hướng trang giới thiệu">
              <button type="button" data-action="scroll-to" data-target="chuc-nang">Tính năng</button>
              <button type="button" data-action="scroll-to" data-target="vai-tro">Vai trò sử dụng</button>
              <button type="button" data-action="scroll-to" data-target="cach-dung">Cách hoạt động</button>
            </nav>

            <div class="landing-nav-actions">
              <button type="button" class="btn btn-ghost btn-sm" data-nav="/dang-nhap">Đăng nhập</button>
              <button type="button" class="btn btn-primary btn-sm" data-nav="/dang-ky">Đăng ký</button>
            </div>
          </div>
        </header>

        <main id="top">
          <section class="hero">
            <div class="l-container hero-grid">
              <div>
                <span class="hero-badge">Dành cho trường Phổ thông Dân tộc Nội trú</span>
                <h1 class="hero-title">Xa bản, vẫn có nhà.</h1>
                <p class="hero-lead">
                  Một ứng dụng gọn nhẹ cho mọi việc của đời sống nội trú: điểm danh ký túc xá, bữa ăn hằng ngày, sổ liên lạc về bản và tự học buổi tối. Gọn nhẹ, phù hợp điện thoại cấu hình thấp.
                </p>
                <div class="hero-cta">
                  <button type="button" class="btn btn-primary btn-lg" data-nav="/dang-ky">
                    ${icon('login', 17)} Đăng ký tài khoản
                  </button>
                  <button type="button" class="btn btn-secondary btn-lg" data-nav="/dang-nhap">
                    Đăng nhập
                  </button>
                </div>
                <ul class="hero-facts">
                  <li>${icon('offline', 17)} Dữ liệu lưu trên máy chủ của trường</li>
                  <li>${icon('key', 17)} Tự đăng ký trong 1 phút</li>
                  <li>${icon('device', 17)} Chữ lớn dễ đọc cho phụ huynh</li>
                </ul>
              </div>
              ${renderPreview()}
            </div>
          </section>

          <section id="chuc-nang" class="l-section">
            <div class="l-container">
              <div class="section-head">
                <h2>Tất cả việc nội trú trong một nơi</h2>
                <p>Các chức năng được sắp xếp theo đúng sinh hoạt và học tập hằng ngày của học sinh, phụ huynh và thầy cô.</p>
              </div>

              <div class="module-cluster">
                <div>
                  <p class="cluster-label">Đời sống nội trú hằng ngày</p>
                  <div class="modules-grid">
                    ${LIFE_MODULES.map(
                      (m) => `
                      <article class="card stack-md">
                        <span class="icon-box ${m.tone}">${icon(m.icon, 20)}</span>
                        <div class="stack-sm">
                          <h3>${esc(m.title)}</h3>
                          <p class="text-muted">${esc(m.desc)}</p>
                        </div>
                      </article>`,
                    ).join('')}
                  </div>
                </div>

                <div>
                  <p class="cluster-label">Học tập, hướng nghiệp và kết nối gia đình</p>
                  <div class="modules-grid">
                    ${STUDY_MODULES.map(
                      (m) => `
                      <article class="card stack-md">
                        <span class="icon-box ${m.tone}">${icon(m.icon, 20)}</span>
                        <div class="stack-sm">
                          <h3>${esc(m.title)}</h3>
                          <p class="text-muted">${esc(m.desc)}</p>
                        </div>
                      </article>`,
                    ).join('')}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="vai-tro" class="l-section l-section-alt">
            <div class="l-container">
              <div class="section-head">
                <h2>Thiết kế riêng cho từng vai trò trong trường</h2>
                <p>Mỗi nhóm người dùng có giao diện tối giản đúng theo công việc hằng ngày, dễ thao tác ngay từ lần đầu sử dụng.</p>
              </div>
              <div class="role-grid">
                ${ROLES.map(
                  (r) => `
                  <article class="role-card" style="cursor:default">
                    <div class="stack-sm">
                      <span class="icon-box ${r.tone}">${icon(r.icon, 20)}</span>
                      <h3>${esc(r.title)}</h3>
                      <p>${esc(r.desc)}</p>
                    </div>
                  </article>`,
                ).join('')}
              </div>
            </div>
          </section>

          <section id="cach-dung" class="l-section">
            <div class="l-container stack-lg">
              <div class="section-head" style="margin-bottom:0">
                <h2>Cách nhà trường và học sinh sử dụng</h2>
                <p>Không yêu cầu học sinh hay phụ huynh tạo email cá nhân, dễ triển khai ngay đầu năm học.</p>
              </div>

              <ol class="steps-grid">
                <li class="step-card">
                  <span class="step-num">1</span>
                  <strong>Đăng ký tài khoản</strong>
                  <span>Học sinh, phụ huynh tự tạo tài khoản; thầy cô và nhân viên dùng tài khoản trường cấp.</span>
                </li>
                <li class="step-card">
                  <span class="step-num">2</span>
                  <strong>Đăng nhập</strong>
                  <span>Dùng tên đăng nhập và mật khẩu của bạn trên bất kỳ điện thoại nào.</span>
                </li>
                <li class="step-card">
                  <span class="step-num">3</span>
                  <strong>Sử dụng hằng ngày</strong>
                  <span>Điểm danh, xem thực đơn, báo cắt suất ăn, xem điểm và hỏi bài ngay trên điện thoại.</span>
                </li>
                <li class="step-card">
                  <span class="step-num">4</span>
                  <strong>Dữ liệu luôn được cập nhật</strong>
                  <span>Mọi thao tác được gửi thẳng lên máy chủ; đổi điện thoại vẫn giữ nguyên dữ liệu.</span>
                </li>
              </ol>

              <div class="cta-band">
                <div>
                  <h2>Bắt đầu trong một phút</h2>
                  <p>Học sinh và phụ huynh tự đăng ký; thầy cô và nhân viên đăng nhập bằng tài khoản nhà trường cấp.</p>
                </div>
                <div class="cta-band-actions">
                  <button type="button" class="btn btn-on-dark btn-lg" data-nav="/dang-ky">
                    Đăng ký ngay
                  </button>
                  <button type="button" class="btn btn-on-dark btn-lg" data-nav="/dang-nhap">
                    Đăng nhập
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer class="app-footer">
          <div class="footer-inner">
            <span><strong>BẢN NHÀ</strong> — ${esc(CONFIG.schoolName)}</span>
            <span>Ứng dụng hỗ trợ học sinh dân tộc nội trú.</span>
          </div>
        </footer>
      </div>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.landing = { renderLandingView, TRIAL_ROLES: ROLES };
})(window);
