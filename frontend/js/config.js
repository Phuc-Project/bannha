/**
 * BẢN NHÀ — Cấu hình trung tâm (Central Configuration)
 * ============================================================================
 * Đồng đội phụ trách Auth (Firebase / Supabase) hoặc AI API chỉ cần điền thông
 * số tại tệp này (hoặc gán `window.BANNHA_ENV` trước khi nạp trang).
 * Khi chưa điền khóa thật, ứng dụng tự động chạy chế độ Offline Demo mượt mà.
 */
(function initConfig(global) {
  const env = global.BANNHA_ENV || {};

  const CONFIG = {
    appVersion: '1.0.0',
    schoolId: 'ptdtnt-bac-ha-01',
    schoolName: 'PTDTNT THPT Vùng Cao Bắc Hà',
    accountEmailDomain: env.ACCOUNT_EMAIL_DOMAIN || 'bannha.internal',

    /**
     * 1. CẤU HÌNH ĐĂNG NHẬP (FIREBASE / SUPABASE / DEMO)
     * - Đổi `provider` sang `'supabase'` hoặc `'firebase'` khi ghép nối thật.
     * - Mã trường cấp (VD: `HS10A01`) tự ánh xạ thành `hs10a01@bannha.internal`.
     */
    auth: {
      provider: env.AUTH_PROVIDER || 'supabase', // 'demo' | 'supabase' | 'firebase'
      supabase: {
        url: env.SUPABASE_URL || 'https://mncyojbematujepethhr.supabase.co',
        // Khóa publishable: an toàn để nằm ở trình duyệt (RLS bảo vệ dữ liệu)
        anonKey: env.SUPABASE_ANON_KEY || 'sb_publishable_I89pwKYERaCEFgTQX6GBSA_khw0e4l7',
      },
      firebase: {
        apiKey: env.FIREBASE_API_KEY || '',
        authDomain: env.FIREBASE_AUTH_DOMAIN || '',
        projectId: env.FIREBASE_PROJECT_ID || '',
      },
    },

    /**
     * 2. CẤU HÌNH BACKEND FASTAPI & ĐỒNG BỘ OFFLINE
     * - Khi `baseUrl` có giá trị, hàng đợi Outbox tự động đẩy lên `/api/v1/sync/push`
     *   và kéo dữ liệu mới từ `/api/v1/sync/pull`.
     */
    api: {
      // Chạy trên máy (Live Server) -> backend local; trên Vercel -> backend Render
      baseUrl:
        env.API_BASE_URL ||
        (['localhost', '127.0.0.1'].includes(global.location.hostname)
          ? 'http://127.0.0.1:8010'
          : 'https://bannha-api.onrender.com'),
      timeoutMs: 10000,
    },

    /**
     * 3. CẤU HÌNH API GIA SƯ AI GỌN NHẸ
     * - `mode: 'backend'` -> gọi `POST {api.baseUrl}/api/v1/tutor/ask` (khuyên dùng, giấu API key).
     * - `mode: 'direct'`  -> gọi thẳng 1 API nhỏ (Gemini / OpenAI-compatible) khi test nhanh.
     * - Khi chưa cấu hình URL/Key hoặc mất sóng -> tự lùi về Gia sư Socratic nội bộ.
     */
    aiTutor: {
      mode: env.AI_TUTOR_MODE || 'backend', // 'backend' | 'direct' | 'local'
      endpoint: env.AI_TUTOR_ENDPOINT || '', // VD: 'https://api.openai.com/v1/chat/completions'
      apiKey: env.AI_TUTOR_API_KEY || '',
      model: env.AI_TUTOR_MODEL || 'gemini-flash-latest',
      dailyLimit: 30,
      minAttemptsForSolution: 2,
    },
  };

  global.BanNha = global.BanNha || {};
  global.BanNha.CONFIG = CONFIG;
})(window);
