/**
 * BẢN NHÀ — Bộ biểu tượng SVG nét đều 1.75px
 */
(function initIcons(global) {
  const PATHS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5Z"/>',
    dorm: '<path d="M4 21V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15M9 9h2m4 0h2M9 13h2m4 0h2M9 21v-4h6v4"/>',
    kitchen: '<path d="M4 11h16a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7Zm3-5v2m5-3v3m5-2v2M6 20h12"/>',
    contact:
      '<path d="M6 4h11a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4Zm2 5h7m-7 4h5"/>',
    tutor:
      '<path d="M12 4 3 8.5 12 13l9-4.5L12 4Zm-6 7v4.5c0 1.8 2.7 3.5 6 3.5s6-1.7 6-3.5V11"/>',
    health:
      '<path d="M12 5v14m-7-7h14M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/>',
    donations:
      '<path d="M12 7v14M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm1-4h16v4H4V7Zm4.5 0a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7s1-5 3.5-5a2.5 2.5 0 1 1 0 5"/>',
    scholarships:
      '<path d="M12 3 2 8l10 5 10-5-10-5Zm0 10v8m-6-5.5v3c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5v-3"/>',
    culture:
      '<path d="m12 3 2.6 5.4 6 .8-4.3 4.2 1 5.9L12 16.5 6.7 19.3l1-5.9L3.4 9.2l6-.8L12 3Z"/>',
    admin:
      '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-2.5a7.6 7.6 0 0 0 0-2l2-1.5-2-3.5-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3h-6l-.3 3a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.5 2.4-1c.5.4 1.1.7 1.7 1l.3 3h6l.3-3c.6-.3 1.2-.6 1.7-1l2.4 1 2-3.5-2-1.5Z"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    qr: '<path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h3v3h-3v-3Zm3 3h3v3h-3v-3Zm-3 3h2m4-6v2"/>',
    phone:
      '<path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5L14 12.5l4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    offline:
      '<path d="M2 8.8a15 15 0 0 1 4.2-2.6M9.7 5.2A15 15 0 0 1 22 8.8M5.5 12.3a10 10 0 0 1 3-1.8m5.2-.3a10 10 0 0 1 4.8 2.1M9 15.8a5 5 0 0 1 6 0M12 19.5h.01M3 3l18 18"/>',
    device: '<path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 15h2"/>',
    key: '<path d="M14.5 3a6.5 6.5 0 1 1-5.6 9.8L3 18.7V21h3v-2h2v-2h2l1.3-1.3A6.5 6.5 0 0 1 14.5 3Zm2 4.5h.01"/>',
    users:
      '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1m0-18a4 4 0 0 1 0 8m6 10v-1a6 6 0 0 0-4-5.6"/>',
    play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5Z"/>',
    login: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l4-4-4-4m4 4H3"/>',
  };

  function icon(name, size = 20) {
    const body = PATHS[name] || PATHS.home;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.icons = { icon };
})(window);
