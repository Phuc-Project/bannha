/**
 * BẢN NHÀ — Trang chủ theo từng vai trò (Action-First Dashboards — Không Hero khẩu hiệu rỗng)
 */
(function initDashboards(global) {
  const { esc } = global.BanNha.utils;
  const { calcWeightedAverage } = global.BanNha.domain;
  const { icon } = global.BanNha.icons;

  // Bảng sắc theo phân hệ (★ luôn dùng nền vàng nghệ)
  const MODULE_TONES = {
    '/dorm': 'tone-forest',
    '/kitchen': 'tone-clay',
    '/health': 'tone-rose',
    '/donations': 'tone-forest',
    '/scholarships': 'tone-indigo',
  };

  const STUDENT_MODULES = [
    {
      path: '/dorm',
      title: 'Ký túc xá số',
      desc: 'Thẻ điểm danh QR ngoại tuyến, xin phép về bản online, báo hỏng đồ phòng ở.',
      icon: 'dorm',
      star: false,
    },
    {
      path: '/kitchen',
      title: 'Bếp ăn minh bạch',
      desc: 'Thực đơn cả tuần, báo cắt suất khi về nhà, góp ý món ăn quê hương.',
      icon: 'kitchen',
      star: false,
    },
    {
      path: '/contact',
      title: '★ Sổ liên lạc Bản – Trường',
      desc: 'Điểm học kỳ 1 hệ số 1–2–3, lịch về nhà và thông báo mới từ thầy cô.',
      icon: 'contact',
      star: true,
    },
    {
      path: '/tutor',
      title: '★ Gia sư AI buổi tối',
      desc: 'Hỏi bài tự học gợi mở từng bước và tạo bộ 5 câu tự luyện theo bài trên lớp.',
      icon: 'tutor',
      star: true,
    },
    {
      path: '/health',
      title: 'Y tế học đường',
      desc: 'Báo ốm, theo dõi chiều cao cân nặng, nhắc lịch khám và nút giữ SOS 2 giây.',
      icon: 'health',
      star: false,
    },
    {
      path: '/donations',
      title: 'Ngân hàng đồ cũ',
      desc: 'Luân chuyển sách giáo khoa, đồng phục, áo ấm mùa đông kín đáo và ấm áp.',
      icon: 'donations',
      star: false,
    },
    {
      path: '/scholarships',
      title: 'Học bổng & hướng nghiệp',
      desc: 'Tổng hợp học bổng DTTS, chế độ cử tuyển và trắc nghiệm nghề 30 câu Holland.',
      icon: 'scholarships',
      star: false,
    },
    {
      path: '/culture',
      title: '★ Kho văn hóa Bản tôi',
      desc: 'Giới thiệu trang phục, lễ hội, ẩm thực và phong tục tốt đẹp của dân tộc mình.',
      icon: 'culture',
      star: true,
    },
  ];

  function renderStudentHome(state, user) {
    const today = global.BanNha.store.helpers.vnTodayIso();
    const checkedIn = state.dormAttendance.some((a) => a.studentId === user.id && a.date === today);
    const todayMenu = state.menus[0];
    const remainingAi = Math.max(0, 30 - state.tutorState.usedToday);

    return `
      <div class="stack-lg">
        <div class="page-head reveal-up" style="--stagger:0">
          <div class="stack-sm">
            <h1>Việc cần làm hôm nay của em</h1>
            <p class="text-muted">
              Chào em <strong>${esc(user.fullName)}</strong> · Lớp ${esc(user.className)} · Phòng ${esc(user.room)} (${esc(user.ethnicity)})
            </p>
          </div>
          <span class="chip">${checkedIn ? 'Tối nay: Đã điểm danh KTX' : 'Tối nay: Chưa điểm danh 21:00'}</span>
        </div>

        <div class="grid-bento-4 reveal-up" style="--stagger:1">
          <div class="kpi-tile">
            <span class="text-muted">Phòng nội trú</span>
            <strong class="kpi-value">${esc(user.room)}</strong>
            <span class="text-muted">${checkedIn ? 'Đã quét thẻ QR' : 'Nhớ quét QR lúc 20:30'}</span>
          </div>
          <div class="kpi-tile">
            <span class="text-muted">Bữa tối hôm nay</span>
            <strong class="kpi-value" style="font-size:1.05rem">${esc(todayMenu.dinner.split(',')[0])}</strong>
            <span class="text-muted">Báo cắt suất trước 15:30</span>
          </div>
          <div class="kpi-tile">
            <span class="text-muted">Lượt hỏi Gia sư AI</span>
            <strong class="kpi-value" data-count="${remainingAi}">${remainingAi}</strong>
            <span class="text-muted">Còn lại trong tối nay</span>
          </div>
          <div class="kpi-tile">
            <span class="text-muted">Học bổng đã lưu</span>
            <strong class="kpi-value" data-count="${state.savedScholarshipIds.length}">${state.savedScholarshipIds.length}</strong>
            <span class="text-muted">Sắp đến hạn tháng 12</span>
          </div>
        </div>

        <section class="stack-md">
          <div class="row-between">
            <h2 class="section-title">8 chức năng đời sống nội trú</h2>
            <span class="chip chip-star">★ Điểm mới nổi bật</span>
          </div>
          <div class="grid-cards">
            ${STUDENT_MODULES.map(
              (m, idx) => `
              <button
                type="button"
                class="card card-interactive ${m.star ? 'card-star' : ''} reveal-up"
                style="--stagger:${idx + 2}"
                data-nav="${m.path}"
              >
                <div class="row-between" style="width:100%">
                  <span class="icon-box ${m.star ? 'icon-box-star' : MODULE_TONES[m.path] || ''}">${icon(m.icon, 22)}</span>
                  <span class="btn-arrow">${icon('arrow', 18)}</span>
                </div>
                <div class="stack-sm">
                  <h3>${esc(m.title)}</h3>
                  <p class="text-muted">${esc(m.desc)}</p>
                </div>
              </button>`,
            ).join('')}
          </div>
        </section>
      </div>`;
  }

  function renderParentHome(state, user) {
    const profilesMap = global.BanNha.store.getProfilesMap();
    const children = (user.childrenIds || ['stu-01']).map((id) => profilesMap[id]).filter(Boolean);
    const child = children.find((c) => c.id === state.session.selectedChildId) || children[0];
    const today = global.BanNha.store.helpers.vnTodayIso();
    const present = state.dormAttendance.some((a) => a.studentId === child.id && a.date === today);
    const childGrades = state.grades.filter((g) => g.studentId === child.id);
    const gpas = childGrades.map(calcWeightedAverage).filter((n) => n !== null);
    const overallGpa = gpas.length
      ? (gpas.reduce((s, v) => s + v, 0) / gpas.length).toFixed(1)
      : '—';
    const childLeaves = state.leaveRequests.filter((l) => l.studentId === child.id);

    return `
      <div class="stack-lg">
        <div class="page-head reveal-up">
          <div class="stack-sm">
            <h1>Hôm nay của con</h1>
            <p class="text-muted">
              Kính chào Phụ huynh · Đang bật chế độ <strong>Chữ lớn 18px</strong> dễ đọc
            </p>
          </div>
          ${
            children.length > 1
              ? `<div class="row-wrap">
                  ${children
                    .map(
                      (c) => `
                    <button
                      type="button"
                      class="btn ${c.id === child.id ? 'btn-primary' : 'btn-secondary'} btn-sm"
                      data-action="select-child"
                      data-child-id="${c.id}"
                    >
                      Con: ${esc(c.fullName)} (${esc(c.className)})
                    </button>`,
                    )
                    .join('')}
                </div>`
              : ''
          }
        </div>

        <div class="grid-2">
          <div class="card reveal-up" style="--stagger:1">
            <span class="chip">${present ? 'Có mặt tại KTX' : 'Đang giờ tự học'}</span>
            <h3 style="margin-top:0.55rem">1. Điểm danh ký túc xá tối nay</h3>
            <p class="text-muted" style="margin-top:0.35rem">
              Em <strong>${esc(child.fullName)}</strong> (Phòng ${esc(child.room)}): ${
                present
                  ? 'Đã quét thẻ QR an toàn tại phòng ở.'
                  : 'Chờ khung điểm danh 20:30 – 21:15.'
              }
            </p>
          </div>

          <div class="card card-star reveal-up" style="--stagger:2">
            <span class="chip chip-star">Hệ số 1 – 2 – 3</span>
            <h3 style="margin-top:0.55rem">2. Kết quả học tập Học kỳ 1</h3>
            <p class="kpi-value" style="margin-top:0.3rem">${overallGpa}</p>
            <p class="text-muted">Điểm trung bình ${childGrades.length} môn đã nhập điểm.</p>
          </div>

          <div class="card reveal-up" style="--stagger:3">
            <h3>3. Sức khỏe & Dinh dưỡng tại trường</h3>
            <p class="text-muted" style="margin-top:0.35rem">
              Thể trạng bình thường, ăn đủ 3 bữa/ngày tại bếp ăn nội trú.
            </p>
          </div>

          <div class="card reveal-up" style="--stagger:4">
            <h3>4. Lịch xin phép về bản</h3>
            <p class="text-muted" style="margin-top:0.35rem">
              ${
                childLeaves.length
                  ? `Có ${childLeaves.length} đơn (${esc(childLeaves[0].fromDate)} → ${esc(childLeaves[0].toDate)}).`
                  : 'Tuần này con ở lại trường ôn bài cuối tuần.'
              }
            </p>
            <div style="margin-top:0.65rem">
              <button type="button" class="btn btn-primary btn-sm" data-nav="/dorm">Tạo đơn xin phép cho con</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderStaffHome(state, user) {
    const role = state.session.activeRole;
    const today = global.BanNha.store.helpers.vnTodayIso();
    const students = global.BanNha.store.getStudents();
    const checkedCount = state.dormAttendance.filter((a) => a.date === today).length;
    const pendingLeaves = state.leaveRequests.filter((l) => l.status === 'pending').length;
    const headcount = global.BanNha.store.getKitchenHeadcount(today);

    return `
      <div class="stack-lg">
        <div class="page-head reveal-up">
          <div class="stack-sm">
            <h1>Bàn điều hành nội trú hôm nay</h1>
            <p class="text-muted">Xin chào <strong>${esc(user.fullName)}</strong> · Ngày ${today}</p>
          </div>
          ${
            state.sosAlerts.length > 0
              ? `<span class="chip chip-danger">Khẩn cấp: ${state.sosAlerts.length} tín hiệu SOS cần xử lý!</span>`
              : `<span class="chip">Toàn khu nội trú ổn định</span>`
          }
        </div>

        <div class="grid-bento-4 reveal-up" style="--stagger:1">
          <div class="kpi-tile">
            <span class="text-muted">Quân số KTX tối nay</span>
            <strong class="kpi-value">${checkedCount}/${students.length}</strong>
            <span class="text-muted">Đã quét thẻ QR</span>
          </div>
          <div class="kpi-tile">
            <span class="text-muted">Đơn xin về chờ duyệt</span>
            <strong class="kpi-value" data-count="${pendingLeaves}">${pendingLeaves}</strong>
            <span class="text-muted">Duyệt sẽ tự cắt suất bếp</span>
          </div>
          <div class="kpi-tile">
            <span class="text-muted">Suất nấu bữa tối</span>
            <strong class="kpi-value" data-count="${headcount.dinner.cooking}">${headcount.dinner.cooking}</strong>
            <span class="text-muted">Đã báo cắt ${headcount.dinner.cuts} suất</span>
          </div>
          <div class="kpi-tile">
            <span class="text-muted">Báo hỏng / Y tế mới</span>
            <strong class="kpi-value">${state.roomReports.filter((r) => r.status !== 'resolved').length + state.healthReports.length}</strong>
            <span class="text-muted">Đang theo dõi xử lý</span>
          </div>
        </div>

        <div class="grid-cards">
          <button type="button" class="card card-interactive reveal-up" style="--stagger:2" data-nav="/dorm">
            <span class="icon-box">${icon('dorm', 22)}</span>
            <div class="stack-sm">
              <h3>Điểm danh QR & Duyệt đơn về bản</h3>
              <p class="text-muted">Quét thẻ ngoại tuyến, cập nhật sửa chữa phòng ở.</p>
            </div>
          </button>
          <button type="button" class="card card-interactive reveal-up" style="--stagger:3" data-nav="/kitchen">
            <span class="icon-box tone-clay">${icon('kitchen', 22)}</span>
            <div class="stack-sm">
              <h3>Bảng tổng hợp suất nấu Nhà bếp</h3>
              <p class="text-muted">Đối chiếu quân số từng bữa và phản hồi thực đơn.</p>
            </div>
          </button>
          <button type="button" class="card card-interactive card-star reveal-up" style="--stagger:4" data-nav="${role === 'admin' ? '/admin' : '/contact'}">
            <span class="icon-box icon-box-star">${icon(role === 'admin' ? 'admin' : 'contact', 22)}</span>
            <div class="stack-sm">
              <h3>${role === 'admin' ? 'Cấp tài khoản CSV & In thẻ QR A4' : '★ Sổ liên lạc & Nhập điểm lớp'}</h3>
              <p class="text-muted">${role === 'admin' ? 'Kiểm tra thử Dry-run CSV và dàn trang in 8 thẻ/A4.' : 'Nhập điểm nhanh và gửi thông báo tới phụ huynh ở bản.'}</p>
            </div>
          </button>
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
