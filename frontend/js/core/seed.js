/**
 * BẢN NHÀ — Cơ sở dữ liệu mẫu chuẩn hóa (Normalized Seed Store)
 * - Mọi thông tin học sinh/giáo viên chỉ lưu 1 lần duy nhất tại `profiles`.
 * - Các bảng nghiệp vụ chỉ tham chiếu khóa ngoại (`studentId`, `authorId`, `leaveId`),
 *   tuyệt đối không sao chép chồng chéo tên/lớp/phòng.
 */
(function initSeed(global) {
  const { makeQrToken } = global.BanNha.utils;
  const SCHOOL_ID = global.BanNha.CONFIG.schoolId;

  function buildInitialState() {
    const profiles = [
      {
        id: 'stu-01',
        code: 'HS10A01',
        fullName: 'Giàng A Minh',
        roles: ['student'],
        className: '10A1',
        room: 'A201',
        ethnicity: 'Mông',
        village: 'Bản Phố, Bắc Hà',
        mustChangePassword: true,
      },
      {
        id: 'stu-02',
        code: 'HS10A02',
        fullName: 'Nông Văn Toàn',
        roles: ['student'],
        className: '10A1',
        room: 'A201',
        ethnicity: 'Tày',
        village: 'Tà Chải, Bắc Hà',
        mustChangePassword: false,
      },
      {
        id: 'stu-03',
        code: 'HS10A03',
        fullName: 'Lý Thị Mai',
        roles: ['student'],
        className: '10A1',
        room: 'B102',
        ethnicity: 'Dao',
        village: 'Nậm Đét, Bắc Hà',
        mustChangePassword: false,
      },
      {
        id: 'stu-04',
        code: 'HS11B01',
        fullName: 'Sùng Thị Hoa',
        roles: ['student'],
        className: '11B1',
        room: 'B102',
        ethnicity: 'Mông',
        village: 'Lùng Phình, Bắc Hà',
        mustChangePassword: false,
      },
      {
        id: 'stu-05',
        code: 'HS11B02',
        fullName: 'Vàng A Páo',
        roles: ['student'],
        className: '11B1',
        room: 'A202',
        ethnicity: 'Mông',
        village: 'Bản Liền, Bắc Hà',
        mustChangePassword: false,
      },
      {
        id: 'stu-06',
        code: 'HS12C01',
        fullName: 'Hoàng Thị Lan',
        roles: ['student'],
        className: '12C1',
        room: 'B201',
        ethnicity: 'Nùng',
        village: 'Bảo Nhai, Bắc Hà',
        mustChangePassword: false,
      },
      {
        id: 'par-01',
        code: 'PH10A01',
        fullName: 'Giàng A Súa (Phụ huynh 2 con)',
        roles: ['parent'],
        childrenIds: ['stu-01', 'stu-04'],
        village: 'Bản Phố, Bắc Hà',
        mustChangePassword: false,
      },
      {
        id: 'tch-01',
        code: 'GV001',
        fullName: 'Cô Lò Thị Hương',
        roles: ['teacher', 'dorm_staff'],
        homeroomClass: '10A1',
        phone: '0912384115',
        mustChangePassword: false,
      },
      {
        id: 'drm-01',
        code: 'QS001',
        fullName: 'Hà Văn Quân',
        roles: ['dorm_staff'],
        phone: '0987410229',
        mustChangePassword: false,
      },
      {
        id: 'med-01',
        code: 'YT001',
        fullName: 'Y sĩ Trần Thị Thảo',
        roles: ['medical_staff'],
        phone: '0976112334',
        mustChangePassword: false,
      },
      {
        id: 'kit-01',
        code: 'NB001',
        fullName: 'Cô Nguyễn Thị Bích',
        roles: ['kitchen_staff'],
        mustChangePassword: false,
      },
      {
        id: 'adm-01',
        code: 'ADMIN01',
        fullName: 'Thầy Đặng Quốc Khánh',
        roles: ['admin'],
        mustChangePassword: false,
      },
    ];

    for (const p of profiles) {
      if (p.roles.includes('student')) {
        p.qrToken = makeQrToken(SCHOOL_ID, p.code, 1);
      }
    }

    return {
      schemaVersion: 4,
      online: true,
      session: {
        userId: null,
        activeRole: null,
        selectedChildId: 'stu-01',
        textSize: 'normal',
        guest: false,
        authProvider: global.BanNha.CONFIG.auth.provider,
        accessToken: null,
      },
      ui: {
        activeTabs: {
          dorm: 'checkin',
          kitchen: 'menu',
          contact: 'overview',
          tutor: 'chat',
          health: 'report',
          donations: 'offers',
          scholarships: 'list',
          culture: 'feed',
          admin: 'accounts',
        },
        csvPreview: null,
        activePracticeQuiz: null,
        lastScannedName: '',
      },

      profiles,

      dormAttendance: [
        { id: 'att-1', studentId: 'stu-01', date: '2026-11-26', time: '20:42', method: 'qr' },
        { id: 'att-2', studentId: 'stu-03', date: '2026-11-26', time: '20:46', method: 'qr' },
        { id: 'att-3', studentId: 'stu-04', date: '2026-11-26', time: '20:49', method: 'qr' },
      ],

      leaveRequests: [
        {
          id: 'lv-01',
          studentId: 'stu-02',
          kind: 'go_home',
          fromDate: '2026-11-27',
          toDate: '2026-11-29',
          reason: 'Cuối tuần em xin về phụ bố mẹ thu hoạch ngô ở Tà Chải.',
          status: 'pending',
          reviewedBy: null,
        },
        {
          id: 'lv-02',
          studentId: 'stu-05',
          kind: 'go_home',
          fromDate: '2026-11-28',
          toDate: '2026-11-29',
          reason: 'Gia đình có đám cưới anh trai ở Bản Liền.',
          status: 'approved',
          reviewedBy: 'drm-01',
        },
      ],

      roomReports: [
        {
          id: 'rm-01',
          room: 'A201',
          reportedBy: 'stu-01',
          category: 'Điện chiếu sáng',
          description: 'Bóng đèn bàn học góc giường tầng 2 bị nhấp nháy buổi tối.',
          status: 'open',
          createdAt: '2026-11-26 07:15',
        },
        {
          id: 'rm-02',
          room: 'B102',
          reportedBy: 'stu-03',
          category: 'Nước sinh hoạt',
          description: 'Vòi nước bồn rửa mặt rò nhẹ cần thay gioăng cao su.',
          status: 'in_progress',
          createdAt: '2026-11-25 18:20',
        },
      ],

      menus: [
        {
          date: '2026-11-26',
          dayLabel: 'Thứ Năm (Hôm nay)',
          breakfast: 'Xôi ngũ sắc Bắc Hà, muối vừng lạc',
          lunch: 'Thịt lợn bản rang cháy cạnh, canh cải mèo nấu gừng, cơm trắng',
          dinner: 'Gà đồi kho sả ớt, su su luộc chấm muối vừng, canh bí đỏ',
        },
        {
          date: '2026-11-27',
          dayLabel: 'Thứ Sáu',
          breakfast: 'Phở gà nóng hành mùi',
          lunch: 'Cá rô phi sốt cà chua, rau muống xào tỏi, canh rau ngót',
          dinner: 'Đậu phụ nhồi thịt sốt cà, bắp cải luộc, canh cà chua trứng',
        },
        {
          date: '2026-11-28',
          dayLabel: 'Thứ Bảy',
          breakfast: 'Bánh cuốn nóng chả quế',
          lunch: 'Thịt bò xào cần tỏi, canh khoai sọ hầm xương',
          dinner: 'Trứng đúc thịt, cải ngọt luộc, canh mướp đắng',
        },
        {
          date: '2026-11-29',
          dayLabel: 'Chủ Nhật',
          breakfast: 'Cháo thịt băm hành hoa',
          lunch: 'Sườn xào chua ngọt, đậu cô ve xào, canh cải xanh',
          dinner: 'Thịt kho trứng cút, củ cải luộc, canh rau dền',
        },
      ],

      // Nguồn đơn nhất cho suất cắt: `source: 'manual' | 'leave'` (không tách 2 bảng chồng chéo)
      mealCuts: [
        {
          id: 'mc-01',
          studentId: 'stu-05',
          date: '2026-11-28',
          meal: 'dinner',
          source: 'leave',
          leaveId: 'lv-02',
        },
        {
          id: 'mc-02',
          studentId: 'stu-05',
          date: '2026-11-29',
          meal: 'breakfast',
          source: 'leave',
          leaveId: 'lv-02',
        },
        {
          id: 'mc-03',
          studentId: 'stu-05',
          date: '2026-11-29',
          meal: 'lunch',
          source: 'leave',
          leaveId: 'lv-02',
        },
      ],

      mealFeedback: [
        {
          id: 'fb-01',
          studentId: 'stu-01',
          dishSuggestion: 'Canh cải mèo nấu thịt băm nóng buổi tối trời lạnh',
          rating: 5,
          note: 'Cơm hôm nay dẻo và nóng, chúng em ăn rất ngon ạ.',
        },
      ],

      grades: [
        {
          id: 'gr-1',
          studentId: 'stu-01',
          subject: 'Toán',
          oral: 8,
          quiz15: 7.5,
          midterm: 8,
          finalExam: 8.5,
        },
        {
          id: 'gr-2',
          studentId: 'stu-01',
          subject: 'Ngữ văn',
          oral: 7,
          quiz15: 7.5,
          midterm: 7.5,
          finalExam: 8,
        },
        {
          id: 'gr-3',
          studentId: 'stu-01',
          subject: 'Vật lý',
          oral: 8.5,
          quiz15: 8,
          midterm: 8.5,
          finalExam: 9,
        },
        {
          id: 'gr-4',
          studentId: 'stu-02',
          subject: 'Toán',
          oral: 7,
          quiz15: 7,
          midterm: 7.5,
          finalExam: 7.5,
        },
        {
          id: 'gr-5',
          studentId: 'stu-04',
          subject: 'Toán',
          oral: 8.5,
          quiz15: 9,
          midterm: 8.5,
          finalExam: 9,
        },
      ],

      announcements: [
        {
          id: 'an-01',
          className: '10A1',
          authorId: 'tch-01',
          title: 'Lịch phát áo ấm mùa đông & họp phụ huynh cuối tháng 11',
          body: 'Nhà trường tổ chức phát áo khoác đồng phục mùa đông vào chiều Thứ Sáu. Phụ huynh ở bản xa có thể xem kết quả học tập trực tiếp trên Sổ liên lạc Bản – Trường.',
          createdAt: '2026-11-26 08:00',
        },
      ],

      lessonTopics: [
        {
          id: 'tp-01',
          className: '10A1',
          subject: 'Toán 10',
          title: 'Hàm số bậc hai và đồ thị Parabol',
          summary: 'Cách xác định tọa độ đỉnh I(-b/2a; -Δ/4a), trục đối xứng và bảng biến thiên.',
        },
        {
          id: 'tp-02',
          className: '10A1',
          subject: 'Vật lý 10',
          title: 'Ba định luật Newton về chuyển động',
          summary: 'Phân tích lực tác dụng, gia tốc a = F/m và cặp lực trực đối.',
        },
      ],

      tutorState: {
        subject: 'Toán 10',
        topicId: 'tp-01',
        usedToday: 2,
        attemptCount: 0,
        messages: [
          {
            id: 'tm-01',
            sender: 'tutor',
            text: 'Chào em! Tối nay tự học phần nào chưa rõ, em cứ chép đề bài hoặc viết bước em đang nghĩ ra nhé. Thầy/cô AI sẽ gợi mở từng bước để em tự tìm ra đáp số.',
            mode: 'welcome',
          },
        ],
      },

      healthReports: [
        {
          id: 'hr-01',
          studentId: 'stu-03',
          symptoms: 'Ho khan và đau họng nhẹ khi sáng sớm trời sương muối',
          severity: 'Nhẹ',
          status: 'Đã cấp nước muối ấm & viên ngậm',
          createdAt: '2026-11-26 06:50',
        },
      ],

      healthChecks: [
        {
          id: 'hc-01',
          studentId: 'stu-01',
          term: 'Đầu HK1 (09/2026)',
          heightCm: 162,
          weightKg: 51,
          note: 'Thể lực tốt',
        },
        {
          id: 'hc-02',
          studentId: 'stu-01',
          term: 'Giữa HK1 (11/2026)',
          heightCm: 164,
          weightKg: 52.5,
          note: 'Tăng trưởng đều',
        },
        {
          id: 'hc-03',
          studentId: 'stu-04',
          term: 'Giữa HK1 (11/2026)',
          heightCm: 156,
          weightKg: 47,
          note: 'Bình thường',
        },
      ],

      medicalReminders: [
        {
          id: 'mr-01',
          studentId: 'stu-01',
          title: 'Khám răng miệng định kỳ toàn khối 10 tại Phòng Y tế',
          dueAt: '2026-11-28 14:00',
          done: false,
        },
      ],

      sosAlerts: [],

      donations: [
        {
          id: 'dn-01',
          donorId: 'stu-06',
          category: 'winter_coat',
          title: 'Áo phao ấm hai lớp màu xanh rừng (còn mới 90%)',
          sizeOrGrade: 'Size M',
          status: 'available',
        },
        {
          id: 'dn-02',
          donorId: 'stu-04',
          category: 'textbook',
          title: 'Trọn bộ SGK & Bài tập Toán – Lý – Hóa lớp 10 (GDPT 2018)',
          sizeOrGrade: 'Khối 10',
          status: 'available',
        },
      ],

      itemRequests: [
        {
          id: 'rq-01',
          studentId: 'stu-01',
          category: 'winter_coat',
          sizeOrGrade: 'Size M',
          urgency: 'high',
          note: 'Áo khoác năm ngoái của em bị chật vai khi trời rét đậm.',
          status: 'open',
        },
        {
          id: 'rq-02',
          studentId: 'stu-02',
          category: 'textbook',
          sizeOrGrade: 'Khối 10',
          urgency: 'normal',
          note: 'Em cần thêm sách Bài tập Vật lý 10 để tự ôn buổi tối.',
          status: 'open',
        },
      ],

      scholarships: [
        {
          id: 'sc-01',
          title: 'Học bổng Vừ A Dính năm học 2026 – 2027',
          sponsor: 'Quỹ Học bổng Vừ A Dính',
          amount: '1.500.000đ / suất + Đồ dùng học tập',
          deadline: '2026-12-10',
          criteria: 'Học sinh DTTS vượt khó, học lực Khá trở lên, rèn luyện Tốt.',
        },
        {
          id: 'sc-02',
          title: 'Chế độ Cử tuyển Đại học Sư phạm & Y Dược vùng đặc biệt khó khăn',
          sponsor: 'UBND Tỉnh & Bộ GD&ĐT',
          amount: 'Miễn 100% học phí + Trợ cấp sinh hoạt hàng tháng',
          deadline: '2027-03-15',
          criteria:
            'Học sinh lớp 12 thường trú từ 5 năm tại xã vùng III, cam kết về phục vụ địa phương.',
        },
      ],

      savedScholarshipIds: ['sc-01'],

      policyArticles: [
        {
          id: 'pa-01',
          title: 'Hướng dẫn chuẩn bị hồ sơ Cử tuyển Đại học – Cao đẳng từ lớp 11, 12',
          summary:
            'Danh mục giấy xác nhận cư trú vùng khó khăn, học bạ 3 năm và quy trình xét tuyển không qua thi.',
        },
        {
          id: 'pa-02',
          title: 'Nghị định 81 & Chính sách hỗ trợ chi phí học tập cho sinh viên dân tộc thiểu số',
          summary:
            'Mức miễn giảm học phí tại các trường công lập và học bổng chính sách bằng 80% lương cơ sở.',
        },
      ],

      careerResult: null,

      culturePosts: [
        {
          id: 'cu-01',
          authorId: 'stu-01',
          ethnicity: 'Mông',
          category: 'Trang phục & Hoa văn',
          title: 'Ý nghĩa hoa văn sáp ong trên váy lanh của người Mông Bắc Hà',
          story:
            'Mỗi dịp Tết Gầu Tào, mẹ và chị em lại đun sáp ong vẽ từng đường xoắn ốc và hình thoi lên tấm vải lanh trắng trước khi nhuộm chàm xanh thẫm.',
          approved: true,
        },
        {
          id: 'cu-02',
          authorId: 'stu-02',
          ethnicity: 'Tày',
          category: 'Ẩm thực bản làng',
          title: 'Cách đồ xôi ngũ sắc từ lá cẩm tím và nghệ rừng',
          story:
            'Năm màu xôi tượng trưng cho ngũ hành và mong ước mùa màng no ấm. Toàn bộ màu đều lấy từ lá cây rừng tự nhiên quanh bản Tà Chải.',
          approved: true,
        },
        {
          id: 'cu-03',
          authorId: 'stu-03',
          ethnicity: 'Dao',
          category: 'Lễ hội truyền thống',
          title: 'Điệu múa chuông ngày Tết Nhảy của người Dao đỏ Nậm Đét',
          story:
            'Tiếng chuông đồng ngân vang hòa cùng sắc khăn thêu đỏ rực cầu chúc bình an cho cả bản bước sang năm mới.',
          approved: false,
        },
      ],

      outbox: [],
    };
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.seed = { buildInitialState };
})(window);
