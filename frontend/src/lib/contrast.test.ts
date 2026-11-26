import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { APPROVED_TEXT_PAIRS, FORBIDDEN_TEXT_PAIRS, TOKENS } from '../styles/palette';

describe('Design tokens & WCAG AA contrast (>= 4.5:1)', () => {
  it('keeps palette.ts synchronized with every CSS variable in tokens.css', () => {
    const cssPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../styles/tokens.css',
    );
    const css = readFileSync(cssPath, 'utf8').toLowerCase();
    for (const [cssVar, hex] of Object.entries(TOKENS)) {
      expect(css).toContain(`${cssVar}: ${hex.toLowerCase()};`);
    }
  });

  it.each(APPROVED_TEXT_PAIRS)(
    'ensures approved pair "%s" meets WCAG AA >= 4.5:1',
    (_label, fg, bg) => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(FORBIDDEN_TEXT_PAIRS)(
    'explicitly flags unsafe pair "%s" (< 4.5:1) so UI never uses it for text',
    (_label, fg, bg) => {
      expect(contrastRatio(fg, bg)).toBeLessThan(4.5);
    },
  );
});
