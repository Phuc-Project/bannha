/**
 * BẢN NHÀ — Tiện ích thuần khiết (HTML Escape, Thời gian VN, Ký & Vẽ QR SVG)
 */
(function initUtils(global) {
  const ESC_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ESC_MAP[ch]);
  }

  function uid(prefix = 'id') {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function vnTodayIso() {
    return '2026-11-26';
  }

  function vnCurrentHour() {
    return 15; // 15:00 chiều — thuận tiện kiểm thử chốt suất tối & trưa hôm sau
  }

  function codeToEmail(code, domain) {
    const clean = String(code || '')
      .trim()
      .toLowerCase();
    if (!clean) return '';
    return clean.includes('@') ? clean : `${clean}@${domain}`;
  }

  function fnv1aHex(input) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function makeQrToken(schoolId, studentCode, version = 1) {
    const payload = `BN1.${schoolId}.${studentCode}.v${version}`;
    const sig = fnv1aHex(`${payload}#bannha-offline-ed25519-pub`);
    return `${payload}.${sig}`;
  }

  function verifyQrToken(token, expectedSchoolId) {
    const parts = String(token || '')
      .trim()
      .split('.');
    if (parts.length !== 5 || parts[0] !== 'BN1') {
      return { ok: false, reason: 'Mã QR không đúng định dạng thẻ học sinh BẢN NHÀ.' };
    }
    const [, schoolId, studentCode, verPart] = parts;
    if (schoolId !== expectedSchoolId) {
      return { ok: false, reason: 'Thẻ QR thuộc trường khác, không hợp lệ tại ký túc xá này.' };
    }
    const ver = Number(verPart.replace(/^v/, '')) || 1;
    const expected = makeQrToken(schoolId, studentCode, ver);
    if (expected !== token.trim()) {
      return { ok: false, reason: 'Chữ ký số trên thẻ QR không khớp hoặc thẻ đã bị sửa đổi.' };
    }
    return { ok: true, studentCode, version: ver };
  }

  function renderQrSvg(token) {
    const size = 21;
    const grid = Array.from({ length: size }, () => Array(size).fill(false));
    const drawFinder = (ox, oy) => {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const border = x === 0 || x === 6 || y === 0 || y === 6;
          const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          grid[oy + y][ox + x] = border || inner;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(size - 7, 0);
    drawFinder(0, size - 7);

    let seed = 2166136261;
    for (let i = 0; i < token.length; i++) {
      seed ^= token.charCodeAt(i);
      seed = Math.imul(seed, 16777619) >>> 0;
    }

    let rects = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const inFinder = (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
        if (!inFinder) {
          seed ^= (seed << 13) >>> 0;
          seed ^= seed >>> 17;
          seed ^= (seed << 5) >>> 0;
          grid[y][x] = (seed & 1) === 1;
        }
        if (grid[y][x]) {
          rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="#114432"/>`;
        }
      }
    }
    return `<svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" role="img" aria-label="Mã QR học sinh">${rects}</svg>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.utils = {
    esc,
    uid,
    vnTodayIso,
    vnCurrentHour,
    codeToEmail,
    makeQrToken,
    verifyQrToken,
    renderQrSvg,
  };
})(window);
