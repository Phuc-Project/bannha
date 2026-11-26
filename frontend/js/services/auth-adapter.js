/**
 * BẢN NHÀ — Module Xác thực trực tuyến (Supabase GoTrue REST + Tự làm mới phiên)
 */
(function initAuthAdapter(global) {
  const { CONFIG } = global.BanNha;
  const { codeToEmail } = global.BanNha.utils;

  const SupabaseAuthProvider = {
    name: 'supabase',
    isConfigured() {
      return Boolean(CONFIG.auth?.supabase?.url && CONFIG.auth?.supabase?.anonKey);
    },

    async signIn(codeOrEmail, password) {
      const email = codeToEmail(codeOrEmail, CONFIG.accountEmailDomain);
      const { url, anonKey } = CONFIG.auth.supabase;

      try {
        const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          return { ok: false, error: 'Sai mã đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại.' };
        }
        const data = await res.json();
        return {
          ok: true,
          provider: 'supabase',
          code: String(codeOrEmail).trim().toUpperCase(),
          uid: data.user?.id || null,
          accessToken: data.access_token || null,
          refreshToken: data.refresh_token || null,
        };
      } catch {
        return { ok: false, error: 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.' };
      }
    },

    async refresh(refreshToken) {
      if (!refreshToken || !this.isConfigured()) {
        return { ok: false, network: false };
      }
      const { url, anonKey } = CONFIG.auth.supabase;
      try {
        const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) {
          return { ok: false, network: false };
        }
        const data = await res.json();
        return {
          ok: true,
          accessToken: data.access_token || null,
          refreshToken: data.refresh_token || refreshToken,
        };
      } catch {
        return { ok: false, network: true };
      }
    },

    async changePassword(accessToken, currentPassword, newPassword) {
      if (CONFIG.api.baseUrl && accessToken) {
        try {
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
            return { ok: false, error: body?.error?.message || 'Không thể đổi mật khẩu.' };
          }
          return { ok: true };
        } catch {
          return { ok: false, error: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.' };
        }
      }

      const { url, anonKey } = CONFIG.auth.supabase;
      try {
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
          : { ok: false, error: 'Không thể cập nhật mật khẩu. Vui lòng thử lại.' };
      } catch {
        return { ok: false, error: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.' };
      }
    },

    /** Tự đăng ký tài khoản học sinh / phụ huynh qua backend (POST /api/v1/auth/register). */
    async register(form) {
      try {
        const res = await fetch(`${CONFIG.api.baseUrl.replace(/\/$/, '')}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username,
            full_name: form.fullName,
            password: form.password,
            role: form.role,
            ethnicity: form.ethnicity || null,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const invalid = Array.isArray(body?.detail) ? 'Thông tin đăng ký chưa hợp lệ.' : null;
          return { ok: false, error: body?.error?.message || invalid || 'Không đăng ký được.' };
        }
        return { ok: true };
      } catch {
        return { ok: false, error: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' };
      }
    },

    async signOut(accessToken) {
      const { url, anonKey } = CONFIG.auth?.supabase || {};
      if (!url || !anonKey || !accessToken) return;
      await fetch(`${url.replace(/\/$/, '')}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
      }).catch(() => undefined);
    },
  };

  function getActiveProvider() {
    return SupabaseAuthProvider;
  }

  function getAuthStatusSummary() {
    return 'Xác thực tài khoản nhà trường';
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.authAdapter = {
    SupabaseAuthProvider,
    getActiveProvider,
    getAuthStatusSummary,
  };
})(window);
