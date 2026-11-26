/**
 * BẢN NHÀ — Module Đăng nhập Độc lập (Auth Adapter: Supabase / Firebase / Demo)
 * ============================================================================
 * Thiết kế sẵn sàng để đồng đội "vibe" tiếp phần xác thực thật chỉ trong vài phút:
 *   1. Mở `js/config.js` -> đặt `auth.provider = 'supabase'` hoặc `'firebase'` và điền khóa.
 *   2. Cả 3 provider bên dưới đều tuân thủ đúng 1 giao diện chuẩn:
 *      - `signIn(codeOrEmail, password)` -> `{ ok, code, accessToken, uid, provider, error }`
 *      - `changePassword(accessToken, currentPassword, newPassword)` -> `{ ok, error }`
 *      - `signOut(accessToken)` -> `Promise<void>`
 */
(function initAuthAdapter(global) {
  const { CONFIG } = global.BanNha;
  const { codeToEmail } = global.BanNha.utils;

  /**
   * 1. SUPABASE AUTH PROVIDER (REST GoTrue chuẩn — không cần cài gói npm nặng)
   *    Hỗ trợ sẵn `supabase.auth` nếu đồng đội nhúng thêm `@supabase/supabase-js` CDN.
   */
  const SupabaseAuthProvider = {
    name: 'supabase',
    isConfigured() {
      return Boolean(CONFIG.auth.supabase.url && CONFIG.auth.supabase.anonKey);
    },

    async signIn(codeOrEmail, password) {
      const email = codeToEmail(codeOrEmail, CONFIG.accountEmailDomain);
      const { url, anonKey } = CONFIG.auth.supabase;

      // Nếu đồng đội đã khởi tạo `window.supabaseClient`, ưu tiên gọi SDK trực tiếp
      if (global.supabaseClient?.auth) {
        const { data, error } = await global.supabaseClient.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return { ok: false, error: 'Sai mã đăng nhập hoặc mật khẩu (Supabase Auth).' };
        }
        return {
          ok: true,
          provider: 'supabase',
          code: String(codeOrEmail).trim().toUpperCase(),
          uid: data.user?.id || null,
          accessToken: data.session?.access_token || null,
        };
      }

      // Mặc định gọi thẳng GoTrue REST endpoint siêu nhẹ
      const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        return { ok: false, error: 'Sai mã đăng nhập hoặc mật khẩu. Hãy kiểm tra lại.' };
      }
      const data = await res.json();
      return {
        ok: true,
        provider: 'supabase',
        code: String(codeOrEmail).trim().toUpperCase(),
        uid: data.user?.id || null,
        accessToken: data.access_token || null,
      };
    },

    async changePassword(accessToken, currentPassword, newPassword) {
      // Ưu tiên gọi qua Backend FastAPI `/api/v1/auth/change-password` để đồng thời tắt cờ `must_change_password`
      if (CONFIG.api.baseUrl && accessToken) {
        const res = await fetch(
          `${CONFIG.api.baseUrl.replace(/\/$/, '')}/api/v1/auth/change-password`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              current_password: currentPassword,
              new_password: newPassword,
            }),
          },
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { ok: false, error: body?.error?.message || 'Không đổi được mật khẩu.' };
        }
        return { ok: true };
      }

      const { url, anonKey } = CONFIG.auth.supabase;
      const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });
      return res.ok
        ? { ok: true }
        : { ok: false, error: 'Không thể cập nhật mật khẩu trên Supabase.' };
    },

    async signOut(accessToken) {
      if (global.supabaseClient?.auth) {
        await global.supabaseClient.auth.signOut().catch(() => undefined);
        return;
      }
      const { url, anonKey } = CONFIG.auth.supabase;
      if (!url || !anonKey || !accessToken) return;
      await fetch(`${url.replace(/\/$/, '')}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
      }).catch(() => undefined);
    },
  };

  /**
   * 2. FIREBASE AUTH PROVIDER (Identity Toolkit REST + tương thích Firebase Modular SDK)
   */
  const FirebaseAuthProvider = {
    name: 'firebase',
    isConfigured() {
      return Boolean(CONFIG.auth.firebase.apiKey);
    },

    async signIn(codeOrEmail, password) {
      const email = codeToEmail(codeOrEmail, CONFIG.accountEmailDomain);
      const { apiKey } = CONFIG.auth.firebase;

      // Nếu đồng đội nạp Firebase Auth SDK lên `window.firebaseAuthHook`
      if (global.firebaseAuthHook?.signIn) {
        return global.firebaseAuthHook.signIn(email, password, codeOrEmail);
      }

      const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });

      if (!res.ok) {
        return { ok: false, error: 'Sai mã đăng nhập hoặc mật khẩu (Firebase Auth).' };
      }
      const data = await res.json();
      return {
        ok: true,
        provider: 'firebase',
        code: String(codeOrEmail).trim().toUpperCase(),
        uid: data.localId || null,
        accessToken: data.idToken || null,
      };
    },

    async changePassword(accessToken, _currentPassword, newPassword) {
      const { apiKey } = CONFIG.auth.firebase;
      const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: accessToken,
          password: newPassword,
          returnSecureToken: true,
        }),
      });
      return res.ok
        ? { ok: true }
        : { ok: false, error: 'Không thể đổi mật khẩu trên Firebase Auth.' };
    },

    async signOut() {
      if (global.firebaseAuthHook?.signOut) {
        await global.firebaseAuthHook.signOut().catch(() => undefined);
      }
    },
  };

  /**
   * 3. LOCAL DEMO AUTH PROVIDER (Chạy ngay lập tức khi chưa điền khóa thật)
   *    Mật khẩu mặc định của mọi tài khoản mẫu: `MatKhau2026`
   */
  const LocalDemoAuthProvider = {
    name: 'demo',
    isConfigured() {
      return true;
    },

    async signIn(codeOrEmail, password, profiles) {
      const normalized = String(codeOrEmail || '')
        .trim()
        .split('@')[0]
        .toUpperCase();
      const found = (profiles || []).find((p) => p.code.toUpperCase() === normalized);
      if (!found) {
        return {
          ok: false,
          error: 'Không tìm thấy mã tài khoản này trong danh sách trường cấp.',
        };
      }
      const expectedPw = found.customPassword || 'MatKhau2026';
      if (String(password || '') !== expectedPw) {
        return {
          ok: false,
          error: 'Mật khẩu chưa đúng (Tài khoản mẫu dùng mật khẩu mặc định: MatKhau2026).',
        };
      }
      return {
        ok: true,
        provider: 'demo',
        code: found.code,
        uid: found.id,
        accessToken: `demo-jwt-${found.code}`,
      };
    },

    async changePassword(_accessToken, _currentPassword, newPassword) {
      if (String(newPassword || '').length < 8 || !/\d/.test(newPassword)) {
        return { ok: false, error: 'Mật khẩu mới cần ít nhất 8 ký tự, gồm cả chữ và số.' };
      }
      return { ok: true };
    },

    async signOut() {
      return Promise.resolve();
    },
  };

  function getActiveProvider() {
    const requested = CONFIG.auth.provider;
    if (requested === 'supabase' && SupabaseAuthProvider.isConfigured()) {
      return SupabaseAuthProvider;
    }
    if (requested === 'firebase' && FirebaseAuthProvider.isConfigured()) {
      return FirebaseAuthProvider;
    }
    return LocalDemoAuthProvider;
  }

  function getAuthStatusSummary() {
    const active = getActiveProvider();
    if (active.name === 'supabase') return 'Đang kết nối Supabase Auth';
    if (active.name === 'firebase') return 'Đang kết nối Firebase Auth';
    return 'Chế độ Offline Demo · Sẵn sàng cắm khóa Supabase / Firebase';
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.authAdapter = {
    SupabaseAuthProvider,
    FirebaseAuthProvider,
    LocalDemoAuthProvider,
    getActiveProvider,
    getAuthStatusSummary,
  };
})(window);
