import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const webDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webDir, '..');

export default defineConfig({
  root: webDir,
  plugins: [react()],
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.join(webDir, 'tests', 'setup.ts')],
    include: ['src/**/*.test.{ts,tsx}', '../scripts/**/*.test.ts'],
  },
});
