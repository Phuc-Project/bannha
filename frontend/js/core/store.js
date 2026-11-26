/**
 * BẢN NHÀ — Kho dữ liệu Local-First chuẩn hóa + IndexedDB + Hàng đợi Outbox
 * ============================================================================
 * - Mọi thao tác đọc/ghi đi qua một Store duy nhất (`BanNha.store`), không chồng chéo.
 * - Khi duyệt/hủy đơn xin về bản (`leaveRequests`), Store tự động tính lại `mealCuts`
 *   theo nguồn `source: 'leave'` trong cùng một giao dịch.
 * - Khi Đăng xuất (`logout`), xóa trắng hoàn toàn IndexedDB để bảo vệ thiết bị dùng chung.
 */
(function initStore(global) {
  const DB_NAME = 'BanNhaNormalizedDB';
  const STORE_NAME = 'app_state';
  const STATE_KEY = 'v4';

  const { CONFIG } = global.BanNha;
  const { uid, vnTodayIso, vnCurrentHour, makeQrToken, verifyQrToken } = global.BanNha.utils;
  const { canModifyMealCut, expandLeaveMeals, computeDonationMatches, scoreRiasec } =
    global.BanNha.domain;
  const { buildInitialState } = global.BanNha.seed;

  let state = buildInitialState();
  const listeners = new Set();

  function openDb() {
    return new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async function hydrateFromIdb() {
    try {
      const db = await openDb();
      if (!db) return;
      const saved = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(STATE_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (saved && saved.schemaVersion === 4 && !saved.session?.guest) {
        state = saved;
      }
    } catch {
      // Giữ state mặc định nếu trình duyệt khóa IndexedDB
    }
  }

  async function persistToIdb() {
    // Bản dùng thử không bao giờ ghi xuống máy
    if (state.session.guest) return;
    try {
      const db = await openDb();
      if (!db) return;
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(state, STATE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Ignore quota errors
    }
  }

  async function wipeIdb() {
    try {
      const db = await openDb();
      if (!db) return;
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Ignore
    }
  }

  function getState() {
    return state;
  }

  function getProfilesMap() {
    const map = {};
    for (const p of state.profiles) map[p.id] = p;
    return map;
  }

  function getCurrentUser() {
    if (!state.session.userId) return null;
    return state.profiles.find((p) => p.id === state.session.userId) || null;
  }

  function getStudents() {
    return state.profiles.filter((p) => p.roles.includes('student'));
  }

  function enqueueOp(command, payload) {
    state.outbox.push({
      op_id: uid('op'),
      command,
      payload,
      client_at: new Date().toISOString(),
    });
    if (state.online) {
      void flushOutbox();
    }
  }

  let flushing = false;
  let lastSyncError = '';

  async function flushOutbox() {
    if (!state.online || flushing) return;
    const serverSync = global.BanNha.serverSync;
    if (!serverSync?.isEnabled(state.session)) {
      // Chế độ Demo: không có máy chủ -> giải phóng Outbox ngay
      if (state.outbox.length === 0) return;
      state.outbox = [];
      void persistToIdb();
      notifyListeners();
      return;
    }
    flushing = true;
    try {
      if (state.outbox.length > 0) {
        const { done, rejected } = await serverSync.push(state);
        const doneSet = new Set(done);
        state.outbox = state.outbox.filter((op) => !doneSet.has(op.op_id));
        lastSyncError = rejected[0]?.error?.message || '';
      }
      await serverSync.pull(getState, mutate);
    } catch (error) {
      // Mất sóng / máy chủ lỗi: giữ Outbox, lần sau gửi lại
      lastSyncError = error?.message || 'Không kết nối được máy chủ.';
    } finally {
      flushing = false;
      void persistToIdb();
      notifyListeners();
    }
  }

  function getLastSyncError() {
    return lastSyncError;
  }

  /**
   * Đồng bộ nguyên tử giữa Đơn xin về (`leaveRequests`) và Cắt suất ăn (`mealCuts`)
   */
  function syncLeaveMealCuts(leave) {
    state.mealCuts = state.mealCuts.filter((mc) => mc.leaveId !== leave.id);
    if (leave.kind === 'go_home' && leave.status === 'approved') {
      const slots = expandLeaveMeals(leave.fromDate, leave.toDate);
      for (const s of slots) {
        const duplicate = state.mealCuts.some(
          (mc) => mc.studentId === leave.studentId && mc.date === s.date && mc.meal === s.meal,
        );
        if (!duplicate) {
          state.mealCuts.push({
            id: uid('mc'),
            studentId: leave.studentId,
            date: s.date,
            meal: s.meal,
            source: 'leave',
            leaveId: leave.id,
          });
        }
      }
      return slots.length;
    }
    return 0;
  }

  function notifyListeners() {
    for (const fn of listeners) fn(state);
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function mutate(updater) {
    const result = updater(state);
    void persistToIdb();
    notifyListeners();
    return result;
  }

  async function mutateAndFlushIdb(updater) {
    const result = updater(state);
    await persistToIdb();
    notifyListeners();
    return result;
  }

  async function logoutAndWipe() {
    const token = state.session.accessToken;
    if (!state.session.guest) {
      await global.BanNha.authAdapter.getActiveProvider().signOut(token);
    }
    state = buildInitialState();
    document.documentElement.removeAttribute('data-text-size');
    await wipeIdb();
    notifyListeners();
  }

  /**
   * Chế độ DÙNG THỬ (khách, chưa đăng nhập): dùng hồ sơ mẫu theo vai trò,
   * không gọi Auth, không ghi IndexedDB, thoát là xóa sạch.
   */
  const TRIAL_PROFILE_BY_ROLE = {
    student: 'stu-02',
    parent: 'par-01',
    teacher: 'tch-01',
    dorm_staff: 'drm-01',
    medical_staff: 'med-01',
    kitchen_staff: 'kit-01',
    admin: 'adm-01',
  };

  function applyTrialRole(role) {
    const safeRole = TRIAL_PROFILE_BY_ROLE[role] ? role : 'student';
    state.session.userId = TRIAL_PROFILE_BY_ROLE[safeRole];
    state.session.activeRole = safeRole;
    state.session.guest = true;
    state.session.accessToken = null;
    state.session.authProvider = 'trial';
    state.session.textSize = safeRole === 'parent' ? 'large' : 'normal';
  }

  function startTrial(role) {
    state = buildInitialState();
    applyTrialRole(role);
    notifyListeners();
  }

  function switchTrialRole(role) {
    applyTrialRole(role);
    notifyListeners();
  }

  /**
   * Các bộ chọn dữ liệu dẫn xuất (Selectors — không bao giờ lưu thừa trong DB)
   */
  function getKitchenHeadcount(dateIso) {
    const totalStudents = getStudents().length;
    const summary = {};
    for (const meal of ['breakfast', 'lunch', 'dinner']) {
      const cuts = state.mealCuts.filter((c) => c.date === dateIso && c.meal === meal).length;
      summary[meal] = {
        total: totalStudents,
        cuts,
        cooking: Math.max(0, totalStudents - cuts),
      };
    }
    return summary;
  }

  function getDonationSuggestions() {
    return computeDonationMatches(state.donations, state.itemRequests, getProfilesMap());
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.store = {
    hydrateFromIdb,
    getState,
    getProfilesMap,
    getCurrentUser,
    getStudents,
    getKitchenHeadcount,
    getDonationSuggestions,
    enqueueOp,
    flushOutbox,
    getLastSyncError,
    syncLeaveMealCuts,
    mutate,
    mutateAndFlushIdb,
    subscribe,
    logoutAndWipe,
    startTrial,
    switchTrialRole,
    helpers: {
      uid,
      vnTodayIso,
      vnCurrentHour,
      makeQrToken,
      verifyQrToken,
      canModifyMealCut,
      scoreRiasec,
    },
  };
})(window);
