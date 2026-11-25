import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const webDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webDir, '..');

export default defineConfig({
  root: webDir,
  envDir: repoRoot,
  css: {
    postcss: path.join(webDir, 'postcss.config.js'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'BẢN NHÀ — Ứng dụng hỗ trợ học sinh dân tộc nội trú',
        short_name: 'BẢN NHÀ',
        description: 'Xa bản, vẫn có nhà. Một ứng dụng – mọi việc của đời sống nội trú.',
        lang: 'vi',
        start_url: '/',
        display: 'standalone',
        background_color: '#FAF6EE',
        theme_color: '#163F33',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'bannha-images',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
                purgeOnQuotaError: true,
              },
            },
          },
        ],
      },
    }),
    visualizer({
      filename: path.join(webDir, 'dist', 'stats.html'),
      gzipSize: true,
      brotliSize: false,
      open: false,
    }),
  ],
  build: {
    target: 'es2019',
    outDir: path.join(webDir, 'dist'),
    emptyOutDir: true,
  },
});
