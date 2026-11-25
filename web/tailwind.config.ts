import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from 'tailwindcss';

const webDir = path.dirname(fileURLToPath(import.meta.url));

export default {
  content: [path.join(webDir, 'index.html'), path.join(webDir, 'src/**/*.{ts,tsx}')],
  theme: {
    extend: {
      colors: {
        forest: {
          900: 'var(--color-forest-900)',
          700: 'var(--color-forest-700)',
          50: 'var(--color-forest-50)',
        },
        cream: 'var(--color-cream)',
        surface: 'var(--color-surface)',
        line: 'var(--color-line)',
        clay: {
          600: 'var(--color-clay-600)',
        },
        turmeric: {
          DEFAULT: 'var(--color-turmeric)',
          50: 'var(--color-turmeric-50)',
        },
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        control: '10px',
        pill: '999px',
      },
      boxShadow: {
        overlay: '0 12px 32px rgba(22, 63, 51, 0.16)',
      },
    },
  },
  plugins: [],
} satisfies Config;
