import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeInitialBundleGzip, MAX_INITIAL_GZIP_BYTES } from './check-budget.mjs';

describe('analyzeInitialBundleGzip', () => {
  it('sums gzip size of entry script and modulepreload chunks while ignoring lazy chunks', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'bannha-budget-'));
    try {
      mkdirSync(path.join(dir, 'assets'));
      writeFileSync(path.join(dir, 'assets', 'index-main.js'), 'const x = 1;\n'.repeat(250));
      writeFileSync(path.join(dir, 'assets', 'vendor-core.js'), 'export const y = 2;\n'.repeat(250));
      writeFileSync(
        path.join(dir, 'assets', 'StyleguidePage-lazy.js'),
        'export const z = 3;\n'.repeat(8000),
      );
      writeFileSync(
        path.join(dir, 'index.html'),
        `<!doctype html><html><head>
          <script type="module" crossorigin src="/assets/index-main.js"></script>
          <link rel="modulepreload" crossorigin href="/assets/vendor-core.js">
        </head><body></body></html>`,
      );

      const report = analyzeInitialBundleGzip(dir);
      expect(report.files.map((item: { file: string }) => item.file)).toEqual([
        'assets/index-main.js',
        'assets/vendor-core.js',
      ]);
      expect(report.totalGzipBytes).toBeGreaterThan(0);
      expect(report.totalGzipBytes).toBeLessThan(MAX_INITIAL_GZIP_BYTES);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
