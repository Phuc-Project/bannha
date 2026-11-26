/**
 * BẢN NHÀ — Trạng thái khởi tạo rỗng (không còn dữ liệu mẫu / chế độ dùng thử)
 * - Mọi dữ liệu nghiệp vụ được kéo từ máy chủ sau khi đăng nhập (`serverSync.pull`).
 * - Mọi thông tin người dùng chỉ lưu 1 lần tại `profiles`; các bảng khác tham chiếu khóa ngoại.
 */
(function initSeed(global) {
  function buildInitialState() {
    return {
      schemaVersion: 5,
      online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
      session: {
        userId: null,
        activeRole: null,
        selectedChildId: null,
        textSize: 'normal',
        authProvider: 'supabase',
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
      server: { cursors: {}, classes: {}, rooms: {} },

      profiles: [],
      dormAttendance: [],
      leaveRequests: [],
      roomReports: [],
      menus: [],
      mealCuts: [],
      mealFeedback: [],
      grades: [],
      announcements: [],
      lessonTopics: [],
      tutorState: {
        subject: 'Toán',
        topicId: null,
        usedToday: 0,
        attemptCount: 0,
        messages: [
          {
            id: 'tm-welcome',
            sender: 'tutor',
            text: 'Chào em! Tối nay tự học phần nào chưa rõ, em cứ chép đề bài hoặc viết bước em đang nghĩ ra nhé. Thầy/cô AI sẽ gợi mở từng bước để em tự tìm ra đáp số.',
            mode: 'welcome',
          },
        ],
      },
      healthReports: [],
      healthChecks: [],
      medicalReminders: [],
      sosAlerts: [],
      donations: [],
      itemRequests: [],
      scholarships: [],
      savedScholarshipIds: [],
      policyArticles: [],
      careerResult: null,
      culturePosts: [],
      outbox: [],
    };
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.seed = { buildInitialState };
})(window);
