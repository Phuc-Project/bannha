const CACHE_NAME = 'bannha-pure-html-v10';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './styles/tokens.css',
  './styles/layout.css',
  './styles/components.css',
  './styles/motion.css',
  './styles/landing.css',
  './js/config.js',
  './js/core/utils.js',
  './js/core/domain.js',
  './js/core/seed.js',
  './js/services/auth-adapter.js',
  './js/services/ai-tutor-api.js',
  './js/services/server-sync.js',
  './js/core/store.js',
  './js/views/icons.js',
  './js/views/landing.js',
  './js/views/shell.js',
  './js/views/auth-views.js',
  './js/views/dashboards.js',
  './js/views/modules-life.js',
  './js/views/modules-study-health.js',
  './js/views/modules-community-admin.js',
  './js/app.js',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('./index.html')),
      ),
  );
});
