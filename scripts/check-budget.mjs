import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

export const MAX_INITIAL_GZIP_BYTES = 170 * 1024;

/**
 * Computes gzip size of initial JS chunks (module scripts + modulepreloads) in index.html.
 * @param {string} distDir
 */
export function analyzeInitialBundleGzip(distDir) {
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!existsSync(indexHtmlPath)) {
    throw new Error(`Missing build output: ${indexHtmlPath}`);
  }

  const html = readFileSync(indexHtmlPath, 'utf8');
  const assetRefs = new Set();

  const scriptRegex = /<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']([^"']+\.js)["'][^>]*>/gi;
  const preloadRegex =
    /<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["']([^"']+\.js)["'][^>]*>/gi;

  for (const regex of [scriptRegex, preloadRegex]) {
    let match = regex.exec(html);
    while (match !== null) {
      const rawHref = match[1];
      if (rawHref && !rawHref.startsWith('http://') && !rawHref.startsWith('https://')) {
        assetRefs.add(rawHref.replace(/^\/+/, ''));
      }
      match = regex.exec(html);
    }
  }

  const files = [];
  let totalGzipBytes = 0;

  for (const relFile of assetRefs) {
    const absPath = path.join(distDir, relFile);
    const content = readFileSync(absPath);
    const gzipBytes = gzipSync(content, { level: 9 }).byteLength;
    files.push({ file: relFile.replace(/\\/g, '/'), gzipBytes });
    totalGzipBytes += gzipBytes;
  }

  return { files, totalGzipBytes };
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  const repoRoot = path.resolve(path.dirname(currentFile), '..');
  const distDir = path.join(repoRoot, 'frontend', 'dist');
  const { files, totalGzipBytes } = analyzeInitialBundleGzip(distDir);

  for (const item of files) {
    process.stdout.write(`  ${item.file}: ${(item.gzipBytes / 1024).toFixed(2)} KB gzip\n`);
  }
  const totalKb = (totalGzipBytes / 1024).toFixed(2);
  const limitKb = (MAX_INITIAL_GZIP_BYTES / 1024).toFixed(0);
  process.stdout.write(`Initial JS total: ${totalKb} KB gzip (budget < ${limitKb} KB)\n`);

  if (totalGzipBytes >= MAX_INITIAL_GZIP_BYTES) {
    process.stderr.write(
      `Bundle budget exceeded: ${totalKb} KB gzip >= ${limitKb} KB gzip limit.\n`,
    );
    process.exit(1);
  }
}
