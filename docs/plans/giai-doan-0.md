# Giai đoạn 0: Khởi tạo dự án, Hệ thống thiết kế & Trang `/dev/ui` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khởi tạo nền tảng PWA Vite + React 18 + TypeScript `strict` đạt ngân sách `< 170KB gzip`, thiết lập trọn bộ design tokens vùng cao đạt chuẩn tương phản WCAG AA (`≥ 4.5:1`), dải thổ cẩm SVG 6px và toàn bộ thư viện component + 4 màn hình mẫu theo vai trò tại `/dev/ui` để duyệt giao diện trước khi bước sang Giai đoạn 1.

**Architecture:** Ứng dụng SPA cấu trúc theo feature và atomic UI primitives không phụ thuộc thư viện UI có sẵn theme. Mọi giá trị màu sắc, cỡ chữ (kể cả chế độ "Chữ lớn" 18px/52px mặc định cho Phụ huynh) và kích thước vùng chạm điều khiển qua CSS custom properties trong `src/styles/tokens.css` kết nối với Tailwind CSS. Trang `/dev/ui` được tách chunk qua `React.lazy` để không làm phình gói JS khởi tạo trên điện thoại Android cấu hình thấp (RAM 2GB, màn hình 360px).

**Tech Stack:** Vite 6 · React 18.3 · TypeScript 5.7 (`strict`) · Tailwind CSS 3.4 + PostCSS · React Router 6 · `vite-plugin-pwa` (Workbox) · `@fontsource/be-vietnam-pro` (400/500/600/700) · `lucide-react` (stroke 1.75) · Vitest + Testing Library · Playwright · `rollup-plugin-visualizer`.

**Spec:** [`PROMPT.md`](../../PROMPT.md) (§0, §1, §2, §3, §8, §10, §11) và [`CLAUDE.md`](../../CLAUDE.md).

## Global Constraints

- Ngôn ngữ giao diện 100% tiếng Việt tự nhiên (xưng hô *"em"*, *"Phụ huynh"*, *"Thầy/Cô"*); comment trong code bằng tiếng Anh ngắn gọn.
- TypeScript `strict: true`, cấm tuyệt đối `any`, cấm `console.log`, cấm `dangerouslySetInnerHTML`, mỗi file `< 300` dòng.
- Chỉ cài đặt đúng các thư viện nằm trong danh sách cho phép tại `PROMPT.md §2`; không dùng Next.js, Redux, `framer-motion`, MUI/Ant/Chakra hay theme mặc định của shadcn.
- Mọi cặp màu chữ/nền sử dụng trong sản phẩm phải đạt độ tương phản **WCAG AA ≥ 4.5:1** (`--color-turmeric` `#E3B23C` cấm làm màu chữ trên nền sáng; `--color-success` `#2E7D4F` không đặt làm chữ trên `--color-forest-50` `#E8F0EC`).
- Body tối thiểu `16px` (`line-height: 1.5`); chế độ "Chữ lớn" (mặc định bật cho `parent`): body `18px`, nút/input cao `52px`; vùng chạm tối thiểu `44×44px`.
- Phân tách khối bằng viền `1px solid var(--color-line)`; card không đổ bóng; chỉ `Sheet` và `Dialog` có shadow nhẹ.
- Dải thổ cẩm SVG cao `6px` **chỉ** xuất hiện tại 3 nơi: mép trên `AppHeader`, màn đăng nhập, và `Footer`.
- Tổng dung lượng JS tải ban đầu **< 170KB gzip** (kiểm tra tự động bằng `npm run check:budget`).
- Tôn trọng `prefers-reduced-motion: reduce`; chuyển động chỉ `150–200ms` cho màu/opacity/transform nhỏ.

## Review Focus

1. **Đường dẫn Windows chứa ký tự tiếng Việt tổ hợp NFD (`d:\bản nhà`):** Mọi file cấu hình Node (`vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `scripts/*.mjs`) phải dùng `fileURLToPath(import.meta.url)` + `path.resolve` thay vì `new URL(...).pathname` để không sinh chuỗi `%CC%89` làm lỗi đọc/ghi file. (Kiểm chứng ở Task 1 qua `npm run build` và `npm run check:budget`).
2. **Bẫy tương phản màu vàng nghệ (`#E3B23C`) và xanh lá (`#2E7D4F`):** `#E3B23C` trên nền trắng chỉ đạt `1.96:1` và `#2E7D4F` trên `forest-50` chỉ đạt `4.35:1`. (Kiểm chứng tự động bằng unit test toán học WCAG 2.1 trong `src/lib/contrast.test.ts` ở Task 2).
3. **Kích hoạt nhầm nút SOS hoặc kẹt bộ đếm khi trượt ngón tay (`HoldButton`):** Chạm nhả sớm `< 2000ms`, sự kiện `pointerleave`/`pointercancel`, hoặc phím giữ `keydown` lặp (`event.repeat === true`) không được phép kích hoạt SOS hay tạo nhiều timer chồng nhau. (Kiểm chứng bằng unit test fake timers trong `src/components/ui/HoldButton.test.tsx` ở Task 3).
4. **Tự động bật "Chữ lớn" cho Phụ huynh nhưng không ghi đè lựa chọn tay:** Khi `role === 'parent'` và chưa có khóa lưu tay trong `localStorage`, cỡ chữ phải tự chuyển sang `large` (`18px`/`52px`); nếu người dùng đã chủ động gạt công tắc hoặc `localStorage` bị khóa trong WebView ẩn danh, ứng dụng vẫn chạy an toàn không văng ngoại lệ. (Kiểm chứng trong `src/app/providers/TextSizeProvider.test.tsx` ở Task 3).
5. **Phình gói JS khởi tạo do import tĩnh trang `/dev/ui` hoặc toàn bộ icon:** Trang `/dev/ui` phải nạp qua `React.lazy`, và `scripts/check-budget.mjs` phải cộng tổng gzip của entry script + toàn bộ `<link rel="modulepreload">` trong `dist/index.html`, báo lỗi nếu `>= 170_000` bytes. (Kiểm chứng ở Task 1 & Task 7).

---

## Cấu trúc File tạo mới trong Giai đoạn 0 (Kiến trúc 5 thư mục `web/`, `supabase/`, `e2e/`, `scripts/`, `docs/`)

```text
ban-nha/
├── .env.example
├── .gitignore
├── .prettierrc.json
├── .prettierignore
├── eslint.config.js
├── package.json                       # npm workspace gốc ("workspaces": ["web"]) + lệnh điều phối
├── playwright.config.ts               # Trỏ testDir: './e2e', preview server từ web/dist
├── vitest.config.ts                   # Chạy toàn bộ *.test.{ts,tsx} trong web/src và scripts/
├── web/
│   ├── index.html
│   ├── package.json                   # Gói frontend Vite + React 18 PWA
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── pwa-192x192.png
│   │   └── pwa-512x512.png
│   └── src/
│       ├── main.tsx
│       ├── vite-env.d.ts
│       ├── test-setup.ts              # jest-dom + polyfill HTMLDialogElement
│       ├── styles/                    # tokens.css, base.css, fonts.ts, palette.ts
│       ├── lib/                       # cx.ts, contrast.ts (+ test), roles.ts
│       ├── app/                       # App.tsx, router.tsx, HomeEntryPage.tsx, UpdatePrompt.tsx, providers/
│       ├── components/                # ui/ (26 files + tests) & layout/ (AppHeader, BottomNav, Sidebar, AppShell)
│       └── dev/ui/                    # StyleguidePage.tsx, sampleData.ts, sections/, previews/
├── supabase/
│   └── README.md                      # Khung thư mục sẵn sàng cho migrations, functions, tests ở GĐ 1
├── e2e/
│   └── styleguide.spec.ts             # Kiểm thử Playwright 360px & 1280px + chụp screenshots
├── scripts/
│   ├── gen-icons.mjs                  # Sinh icon vào web/public/
│   ├── check-budget.mjs               # Đo gzip initial JS từ web/dist/index.html (< 170KB)
│   └── check-budget.test.ts           # Unit test bộ đo ngân sách gói JS
└── docs/
    ├── assumptions.md
    ├── plans/giai-doan-0.md
    └── screenshots/gd0/
```

---

### Task 1: Khởi tạo Git, Cấu hình Dự án, PWA Icons & Bộ kiểm Ngân sách Bundle (`< 170KB gzip`)

**Files:**
- Create: `.gitignore`, `.env.example`, `.prettierrc.json`, `.prettierignore`, `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `postcss.config.js`, `tailwind.config.ts`, `eslint.config.js`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `index.html`
- Create: `scripts/gen-icons.mjs`, `scripts/check-budget.mjs`
- Create: `src/vite-env.d.ts`, `src/main.tsx`, `src/app/App.tsx`, `tests/setup.ts`
- Test: `tests/unit/budget-script.test.ts`

**Interfaces:**
- Produces:
  - NPM scripts: `dev`, `build`, `preview`, `lint`, `format:check`, `typecheck`, `test`, `test:e2e`, `gen:icons`, `check:budget`, `verify`
  - `analyzeInitialBundleGzip(distDir: string): { files: Array<{ file: string; gzipBytes: number }>; totalGzipBytes: number }` exported from `scripts/check-budget.mjs`

- [ ] **Step 1: Khởi tạo Git repo và tạo các file cấu hình gốc (`package.json`, `.gitignore`, `.env.example`, TypeScript, Tailwind, ESLint, Prettier)**

Chạy `git init -b main` tại thư mục gốc dự án, sau đó tạo `package.json` với danh sách package tối giản đúng chuẩn `PROMPT.md §2`:

```json
{
  "name": "ban-nha",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 4173",
    "lint": "eslint . && prettier --check .",
    "format": "prettier --write .",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "gen:icons": "node scripts/gen-icons.mjs",
    "check:budget": "node scripts/check-budget.mjs",
    "verify": "npm run lint && npm run typecheck && npm run test && npm run build && npm run check:budget"
  },
  "dependencies": {
    "@fontsource/be-vietnam-pro": "^5.1.0",
    "@supabase/supabase-js": "^2.48.1",
    "browser-image-compression": "^2.0.2",
    "date-fns": "^4.1.0",
    "dexie": "^4.0.11",
    "dexie-react-hooks": "^1.1.7",
    "lucide-react": "^0.475.0",
    "qrcode": "^1.5.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.1",
    "zod": "^3.24.2",
    "@zxing/browser": "^0.1.5"
  },
  "devDependencies": {
    "@eslint/js": "^9.19.0",
    "@playwright/test": "^1.50.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^22.13.1",
    "@types/qrcode": "^1.5.5",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.19.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.18",
    "globals": "^15.14.0",
    "jsdom": "^26.0.0",
    "postcss": "^8.5.1",
    "prettier": "^3.4.2",
    "rollup-plugin-visualizer": "^5.14.0",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.22.0",
    "vite": "^6.1.0",
    "vite-plugin-pwa": "^0.21.1",
    "vitest": "^3.0.5"
  }
}
```

Tạo `.env.example` đúng mẫu `PROMPT.md §2`, `.gitignore` bỏ qua `node_modules`, `dist`, `.env`, `.env.local`, `playwright-report`, `test-results`, `coverage`, và cấu hình `tsconfig.app.json` bật `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noFallthroughCasesInSwitch: true`, `noUncheckedIndexedAccess: true`.

Cấu hình `tailwind.config.ts` nối toàn bộ CSS variables:

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
```

Cấu hình `vite.config.ts` tích hợp `VitePWA` (cache app shell + `.woff2` + `.svg/.png`, runtime cache ảnh `StaleWhileRevalidate` tối đa 80 ảnh / 30 ngày để giữ dưới ngưỡng 50MB) và `visualizer({ filename: 'dist/stats.html', gzipSize: true })`, luôn dùng `fileURLToPath(new URL('./src', import.meta.url))` cho đường dẫn tiếng Việt trên Windows.

- [ ] **Step 2: Viết unit test đỏ cho bộ kiểm ngân sách gói JS (`tests/unit/budget-script.test.ts`)**

```ts
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeInitialBundleGzip, MAX_INITIAL_GZIP_BYTES } from '../../scripts/check-budget.mjs';

describe('analyzeInitialBundleGzip', () => {
  it('sums gzip size of entry module and modulepreload chunks referenced in index.html', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'bannha-budget-'));
    try {
      mkdirSync(path.join(dir, 'assets'));
      writeFileSync(path.join(dir, 'assets', 'index-abc.js'), 'const a = 1;\n'.repeat(200));
      writeFileSync(path.join(dir, 'assets', 'vendor-def.js'), 'export const b = 2;\n'.repeat(200));
      writeFileSync(path.join(dir, 'assets', 'lazy-styleguide.js'), 'export const huge = 3;\n'.repeat(5000));
      writeFileSync(
        path.join(dir, 'index.html'),
        `<!doctype html><html><head>
          <script type="module" crossorigin src="/assets/index-abc.js"></script>
          <link rel="modulepreload" crossorigin href="/assets/vendor-def.js">
        </head><body></body></html>`,
      );

      const report = analyzeInitialBundleGzip(dir);
      expect(report.files.map((item) => item.file)).toEqual([
        'assets/index-abc.js',
        'assets/vendor-def.js',
      ]);
      expect(report.totalGzipBytes).toBeGreaterThan(0);
      expect(report.totalGzipBytes).toBeLessThan(MAX_INITIAL_GZIP_BYTES);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 3: Cài đặt dependencies và chạy test để xác nhận trạng thái đỏ**

Run: `npm install && npm run test -- tests/unit/budget-script.test.ts`
Expected: FAIL với lỗi không tìm thấy `../../scripts/check-budget.mjs`.

- [ ] **Step 4: Triển khai `scripts/gen-icons.mjs`, `scripts/check-budget.mjs`, `tests/setup.ts` và khung `src/main.tsx` tối thiểu**

Viết `scripts/check-budget.mjs` dùng `fileURLToPath`, `zlib.gzipSync`, phân tích mọi thẻ `<script type="module" src="...">` và `<link rel="modulepreload" href="...">` trong `dist/index.html`, xuất `MAX_INITIAL_GZIP_BYTES = 170 * 1024`, và thoát mã lỗi `1` nếu vượt ngưỡng.
Viết `scripts/gen-icons.mjs` sinh `public/favicon.svg`, `public/pwa-192x192.png`, `public/pwa-512x512.png` (nền xanh rừng `#163F33`, mái nhà sàn kem `#FAF6EE` + điểm nhấn thoi thổ cẩm `#E3B23C` / `#B8431E` bằng bộ tạo PNG CRC32 + `zlib.deflateSync` thuần Node, không cần thư viện ảnh ngoài).
Viết `tests/setup.ts` nạp `@testing-library/jest-dom/vitest` và polyfill `HTMLDialogElement.prototype.showModal` / `close` cho môi trường JSDOM.

- [ ] **Step 5: Chạy sinh icon, kiểm thử unit, typecheck và build kiểm chứng**

Run: `npm run gen:icons && npm run test && npm run build && npm run check:budget`
Expected: PASS toàn bộ, xuất hiện `public/pwa-192x192.png`, `public/pwa-512x512.png`, `dist/stats.html`, tổng gzip khởi tạo `< 75KB`.

- [ ] **Step 6: Commit Task 1**

```bash
git add .
git commit -m "chore: bootstrap Vite PWA, strict TypeScript, Tailwind, test runners, and bundle budget check"
```

---

### Task 2: Hệ thống Design Tokens, Kiểm chứng Toán học WCAG AA & Nhận diện Vùng cao (`TribalStripe`, `SyncBadge`, `IconTile`, `SectionTitle`, `StatusBadge`)

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/fonts.ts`, `src/styles/palette.ts`, `src/lib/cx.ts`, `src/lib/contrast.ts`
- Create: `src/components/ui/TribalStripe.tsx`, `src/components/ui/IconTile.tsx`, `src/components/ui/SectionTitle.tsx`, `src/components/ui/StatusBadge.tsx`, `src/components/ui/SyncBadge.tsx`
- Test: `src/lib/contrast.test.ts`, `src/components/ui/SyncBadge.test.tsx`

**Interfaces:**
- Produces:
  - `TOKENS` & `APPROVED_TEXT_PAIRS` trong `src/styles/palette.ts`
  - `contrastRatio(fgHex: string, bgHex: string): number` trong `src/lib/contrast.ts`
  - `SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'error'`
  - `formatSyncLabel(state: { status: SyncStatus; minutesAgo?: number; pendingCount?: number }): string`
  - `<TribalStripe className?: string />`, `<IconTile icon: LucideIcon; featured?: boolean />`, `<SectionTitle title: string; action?: ReactNode />`, `<StatusBadge tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger'; label: string />`, `<SyncBadge status: SyncStatus; minutesAgo?: number; pendingCount?: number; onRetry?: () => void />`

- [ ] **Step 1: Viết unit test đỏ cho độ tương phản WCAG AA (`src/lib/contrast.test.ts`) và nhãn đồng bộ (`src/components/ui/SyncBadge.test.tsx`)**

```ts
// src/lib/contrast.test.ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { APPROVED_TEXT_PAIRS, FORBIDDEN_TEXT_PAIRS, TOKENS } from '../styles/palette';

describe('Design tokens & WCAG AA contrast (>= 4.5:1)', () => {
  it('keeps palette.ts synchronized with tokens.css hex declarations', () => {
    const cssPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../styles/tokens.css');
    const css = readFileSync(cssPath, 'utf8');
    for (const [cssVar, hex] of Object.entries(TOKENS)) {
      expect(css).toContain(`${cssVar}: ${hex};`);
    }
  });

  it.each(APPROVED_TEXT_PAIRS)('ensures %s on %s meets WCAG AA >= 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(FORBIDDEN_TEXT_PAIRS)('flags unsafe pair %s (< 4.5:1) so components never use it', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeLessThan(4.5);
  });
});
```

```tsx
// src/components/ui/SyncBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SyncBadge, formatSyncLabel } from './SyncBadge';

describe('SyncBadge', () => {
  it('formats exact Vietnamese sync copy required by spec §3.6', () => {
    expect(formatSyncLabel({ status: 'synced', minutesAgo: 2 })).toBe('Đã đồng bộ 2 phút trước');
    expect(formatSyncLabel({ status: 'synced', minutesAgo: 0 })).toBe('Vừa đồng bộ xong');
    expect(formatSyncLabel({ status: 'pending', pendingCount: 3 })).toBe('Đang chờ gửi 3 mục');
    expect(formatSyncLabel({ status: 'offline' })).toBe('Đang ngoại tuyến');
  });

  it('renders both visual indicator and accessible text without relying on color alone', () => {
    render(<SyncBadge status="pending" pendingCount={3} />);
    expect(screen.getByText('Đang chờ gửi 3 mục')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận trạng thái đỏ**

Run: `npm run test -- src/lib/contrast.test.ts src/components/ui/SyncBadge.test.tsx`
Expected: FAIL vì chưa có `contrast.ts`, `palette.ts`, `SyncBadge.tsx`.

- [ ] **Step 3: Viết `tokens.css`, `base.css`, `fonts.ts`, `palette.ts`, `contrast.ts` và 5 component nhận diện**

Khai báo `src/styles/tokens.css`:

```css
:root {
  --color-forest-900: #163F33;
  --color-forest-700: #1E5A47;
  --color-forest-50: #E8F0EC;
  --color-cream: #FAF6EE;
  --color-surface: #FFFFFF;
  --color-line: #E7E0D2;
  --color-clay-600: #B8431E;
  --color-turmeric: #E3B23C;
  --color-turmeric-50: #FDF6E3;
  --color-ink: #1C2B25;
  --color-muted: #5B6B63;
  --color-danger: #C62828;
  --color-success: #2E7D4F;

  --font-size-body: 1rem;        /* 16px */
  --font-size-sub: 0.875rem;     /* 14px */
  --font-size-section: 1.25rem;  /* 20px */
  --font-size-title: 1.5rem;     /* 24px */
  --control-height: 2.75rem;     /* 44px */
}

html[data-text-size='large'] {
  --font-size-body: 1.125rem;    /* 18px */
  --font-size-sub: 1rem;         /* 16px */
  --font-size-section: 1.375rem; /* 22px */
  --font-size-title: 1.625rem;   /* 26px */
  --control-height: 3.25rem;     /* 52px */
}
```

Thiết kế `TribalStripe.tsx` cao đúng `6px` (`h-[6px] w-full block select-none`), dùng `<pattern id={patternId} width="48" height="6" patternUnits="userSpaceOnUse">` với các khối ô vuông đỏ đất (`#B8431E`) lồng hạt kem (`#FAF6EE`), hình thoi vàng nghệ (`#E3B23C`), ô vuông kem và hình thoi đỏ đất trên nền xanh rừng (`#163F33`), đặt `aria-hidden="true"`.

- [ ] **Step 4: Chạy test xác nhận xanh**

Run: `npm run test -- src/lib/contrast.test.ts src/components/ui/SyncBadge.test.tsx`
Expected: PASS toàn bộ cặp màu hợp lệ (`>= 4.5:1`) và nhãn `SyncBadge`.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/styles src/lib src/components/ui/TribalStripe.tsx src/components/ui/IconTile.tsx src/components/ui/SectionTitle.tsx src/components/ui/StatusBadge.tsx src/components/ui/SyncBadge.tsx src/components/ui/SyncBadge.test.tsx
git commit -m "feat(ui): add highland design tokens, WCAG AA contrast guard, TribalStripe, and SyncBadge"
```

---

### Task 3: Providers (`TextSizeProvider`, `ToastProvider`) & Nhóm Nút Hành động (`Button`, `IconButton`, `HoldButton` SOS 2 giây)

**Files:**
- Create: `src/lib/roles.ts`, `src/app/providers/TextSizeProvider.tsx`, `src/app/providers/ToastProvider.tsx`
- Create: `src/components/ui/Button.tsx`, `src/components/ui/IconButton.tsx`, `src/components/ui/HoldButton.tsx`
- Test: `src/app/providers/TextSizeProvider.test.tsx`, `src/app/providers/ToastProvider.test.tsx`, `src/components/ui/HoldButton.test.tsx`

**Interfaces:**
- Consumes: `cx` từ `src/lib/cx.ts`
- Produces:
  - `UserRole = 'student' | 'teacher' | 'dorm_staff' | 'medical_staff' | 'kitchen_staff' | 'parent' | 'admin'`
  - `useTextSize(): { textSize: 'normal' | 'large'; setTextSize: (mode: 'normal' | 'large') => void; toggleTextSize: () => void }`
  - `useToast(): { showToast: (message: string, tone?: 'default' | 'success' | 'danger') => void }`
  - `<Button variant?: 'primary' | 'secondary' | 'tonal' | 'danger' | 'ghost'; loading?: boolean; fullWidth?: boolean />`
  - `<HoldButton label: string; holdDurationMs?: number; onTrigger: () => void />` (mặc định `holdDurationMs = 2000`)

- [ ] **Step 1: Viết unit test đỏ cho `TextSizeProvider` và `HoldButton` 2 giây**

```tsx
// src/app/providers/TextSizeProvider.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { TextSizeProvider, useTextSize } from './TextSizeProvider';

function Probe() {
  const { textSize, toggleTextSize } = useTextSize();
  return <button onClick={toggleTextSize}>Chế độ: {textSize}</button>;
}

describe('TextSizeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-text-size');
  });

  it('enables large text automatically for parent role when no manual preference exists', () => {
    render(
      <TextSizeProvider role="parent">
        <Probe />
      </TextSizeProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Chế độ: large');
    expect(document.documentElement.getAttribute('data-text-size')).toBe('large');
  });

  it('preserves explicit user override across roles', async () => {
    const user = userEvent.setup();
    render(
      <TextSizeProvider role="parent">
        <Probe />
      </TextSizeProvider>,
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('Chế độ: normal');
    expect(window.localStorage.getItem('bannha.textSize')).toBe('normal');
  });
});
```

```tsx
// src/components/ui/HoldButton.test.tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HoldButton } from './HoldButton';

describe('HoldButton (SOS 2-second guard)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does NOT trigger when released before 2000ms', () => {
    const onTrigger = vi.fn();
    render(<HoldButton label="Giữ 2 giây gọi SOS" onTrigger={onTrigger} />);
    const btn = screen.getByRole('button', { name: /Giữ 2 giây gọi SOS/i });

    fireEvent.pointerDown(btn);
    act(() => vi.advanceTimersByTime(1500));
    fireEvent.pointerUp(btn);
    act(() => vi.advanceTimersByTime(1000));

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('triggers exactly once after continuous 2000ms hold and ignores keyboard repeat events', () => {
    const onTrigger = vi.fn();
    render(<HoldButton label="Giữ 2 giây gọi SOS" onTrigger={onTrigger} />);
    const btn = screen.getByRole('button', { name: /Giữ 2 giây gọi SOS/i });

    fireEvent.keyDown(btn, { key: ' ' });
    fireEvent.keyDown(btn, { key: ' ', repeat: true });
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.keyUp(btn, { key: ' ' });

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận trạng thái đỏ**

Run: `npm run test -- src/app/providers/TextSizeProvider.test.tsx src/components/ui/HoldButton.test.tsx`
Expected: FAIL vì chưa tồn tại module.

- [ ] **Step 3: Triển khai `roles.ts`, `TextSizeProvider`, `ToastProvider`, `Button`, `IconButton`, `HoldButton`**

- `Button.tsx`: cao tối thiểu `min-h-[var(--control-height)]` (`44px` ở chế độ thường, `52px` ở Chữ lớn), bo góc `10px`, chữ `font-semibold`, `transition-colors duration-150`, hiển thị vòng xoay nhẹ + `aria-busy={loading}` khi đang xử lý để ngăn bấm đúp.
- `HoldButton.tsx`: nền `--color-danger` (`#C62828`), chữ trắng (`5.62:1`), dải tiến trình lấp dần từ trái sang phải theo % thời gian giữ (cập nhật mỗi `50ms`), tự hủy khi `pointerUp`, `pointerLeave`, `pointerCancel`, `blur`, hoặc `keyUp` trước khi đủ `2000ms`.

- [ ] **Step 4: Viết thêm `ToastProvider.test.tsx` và chạy toàn bộ test Task 3**

Run: `npm run test -- src/app/providers/ src/components/ui/HoldButton.test.tsx`
Expected: PASS 100%.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/lib/roles.ts src/app/providers src/components/ui/Button.tsx src/components/ui/IconButton.tsx src/components/ui/HoldButton.tsx src/components/ui/HoldButton.test.tsx
git commit -m "feat(ui): add TextSizeProvider, ToastProvider, Button, and 2-second SOS HoldButton"
```

---

### Task 4: Khối Nội dung, Phản hồi & Biểu mẫu (`Card`, `ListRow`, `EmptyState`, `Banner`, `Field`, `Input`, `Textarea`, `Select`, `Chip`, `Checkbox`, `Switch`)

**Files:**
- Create: `src/components/ui/Card.tsx`, `src/components/ui/ListRow.tsx`, `src/components/ui/EmptyState.tsx`, `src/components/ui/Banner.tsx`
- Create: `src/components/ui/Field.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Textarea.tsx`, `src/components/ui/Select.tsx`, `src/components/ui/Chip.tsx`, `src/components/ui/Checkbox.tsx`, `src/components/ui/Switch.tsx`
- Test: `src/components/ui/forms-and-cards.test.tsx`

**Interfaces:**
- Consumes: `Button`, `IconTile`, `cx`
- Produces:
  - `<Card variant?: 'default' | 'featured' | 'forest'; padding?: 'md' | 'none' />`
  - `<EmptyState title: string; description?: string; actionLabel: string; onAction: () => void />`
  - `<Banner tone?: 'offline' | 'danger' | 'info' | 'success'; title: string; description?: string; actionLabel?: string; onAction?: () => void />`
  - `<Field id: string; label: string; hint?: string; error?: string; required?: boolean>{children}</Field>`
  - `<Input />` (hỗ trợ `allowRevealPassword?: boolean` cho ô mật khẩu), `<Textarea />`, `<Select options={...} />`, `<Chip selected?: boolean; icon?: LucideIcon />`, `<Checkbox label: string />`, `<Switch label: string; checked: boolean; onCheckedChange: (next: boolean) => void />`

- [ ] **Step 1: Viết unit test đỏ (`src/components/ui/forms-and-cards.test.tsx`)**

Kiểm tra:
1. `Field` gắn đúng `htmlFor`, `aria-invalid="true"` và `aria-describedby` trỏ tới phần tử lỗi khi có `error`.
2. `Input` với `type="password"` và `allowRevealPassword` chuyển đổi qua lại giữa `password` và `text` với nút có nhãn tiếng Việt `"Hiện mật khẩu"` / `"Ẩn mật khẩu"`.
3. `EmptyState` luôn hiển thị nút hành động cụ thể và gọi `onAction` khi nhấn.
4. `Card` biến thể `featured` áp dụng nền `bg-turmeric-50` và viền `border-turmeric`, không có class `shadow-*`.
5. `Chip` cập nhật `aria-pressed` khi chọn/bỏ chọn triệu chứng sức khỏe.

- [ ] **Step 2: Chạy test xác nhận đỏ**

Run: `npm run test -- src/components/ui/forms-and-cards.test.tsx`
Expected: FAIL do các file component chưa được tạo.

- [ ] **Step 3: Triển khai các component Card, Feedback và Form**

Đảm bảo:
- `Input`, `Select`, `Textarea` dùng cỡ chữ `text-[length:var(--font-size-body)]` (`>= 16px`) để trình duyệt di động không tự phóng to gây lệch khung hình khi học sinh chạm nhập liệu trên màn 360px.
- `Banner` dùng nền `surface` (hoặc `turmeric-50` cho trạng thái ngoại tuyến) với viền `1px` + thanh chỉ thị trái `4px` và icon rõ nghĩa để người mù màu vẫn phân biệt được mức độ nghiêm trọng.
- Mỗi file giữ gọn dưới 150 dòng.

- [ ] **Step 4: Chạy test xác nhận xanh**

Run: `npm run test -- src/components/ui/forms-and-cards.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/components/ui
git commit -m "feat(ui): implement Card, EmptyState, Banner, and accessible form controls"
```

---

### Task 5: Hộp thoại, Điều hướng Nội bộ & Hiển thị Tiến trình (`Dialog`, `Sheet`, `Tabs`, `Timeline`, `ProgressBar`, `Skeleton`)

**Files:**
- Create: `src/components/ui/Dialog.tsx`, `src/components/ui/Sheet.tsx`, `src/components/ui/Tabs.tsx`, `src/components/ui/Timeline.tsx`, `src/components/ui/ProgressBar.tsx`, `src/components/ui/Skeleton.tsx`
- Test: `src/components/ui/overlays-and-tabs.test.tsx`

**Interfaces:**
- Produces:
  - `<Dialog open: boolean; onClose: () => void; title: string; description?: string; footer?: ReactNode>{children}</Dialog>`
  - `<Sheet open: boolean; onClose: () => void; title: string; description?: string>{children}</Sheet>`
  - `<Tabs items: Array<{ id: string; label: string; content: ReactNode }>; defaultValue?: string />`
  - `<Timeline items: Array<{ id: string; title: string; time: string; note?: string; tone?: 'done' | 'current' | 'pending' | 'danger' }> />`
  - `<ProgressBar label: string; value: number; max?: number; valueText?: string />`

- [ ] **Step 1: Viết unit test đỏ (`src/components/ui/overlays-and-tabs.test.tsx`)**

Kiểm tra:
1. `Tabs` hỗ trợ chuyển tab bằng chuột và bằng phím `ArrowRight`, `ArrowLeft`, `Home`, `End` chuẩn WAI-ARIA (`role="tablist"`, `aria-selected`).
2. `Dialog` và `Sheet` mở qua `HTMLDialogElement.showModal()`, gắn `aria-labelledby` tới tiêu đề, có shadow nhẹ `shadow-overlay` (duy nhất `Dialog` và `Sheet` được phép có shadow theo `PROMPT.md §3.2`), và gọi `onClose` khi bấm nút `"Đóng"`.
3. `ProgressBar` gắn `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax`.

- [ ] **Step 2: Chạy test xác nhận đỏ**

Run: `npm run test -- src/components/ui/overlays-and-tabs.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Triển khai `Dialog`, `Sheet`, `Tabs`, `Timeline`, `ProgressBar`, `Skeleton`**

- `Sheet.tsx`: trên màn hình `< 768px` neo sát đáy màn hình (`mt-auto w-full rounded-t-[16px] border-t border-line`), trên màn hình `>= 768px` căn giữa gọn gàng như panel hộp thoại, có `shadow-overlay`.
- `Skeleton.tsx`: dùng `motion-safe:animate-pulse bg-forest-50` để tự tắt nhấp nháy khi bật `prefers-reduced-motion`.

- [ ] **Step 4: Chạy test xác nhận xanh**

Run: `npm run test -- src/components/ui/overlays-and-tabs.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit Task 5**

```bash
git add src/components/ui
git commit -m "feat(ui): add accessible Dialog, bottom Sheet, keyboard Tabs, Timeline, and ProgressBar"
```

---

### Task 6: Bố cục Thích ứng theo Vai trò (`AppShell`, `AppHeader`, `BottomNav`, `Sidebar`) & Bộ định tuyến Lazy

**Files:**
- Create: `src/components/layout/AppHeader.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/AppShell.tsx`
- Create: `src/app/UpdatePrompt.tsx`, `src/app/HomeEntryPage.tsx`, `src/app/router.tsx`
- Modify: `src/app/App.tsx`
- Test: `src/components/layout/AppShell.test.tsx`

**Interfaces:**
- Consumes: `TribalStripe`, `SyncBadge`, `UserRole`, `useTextSize`
- Produces:
  - `<AppShell role: UserRole; title: string; subtitle?: string; syncState: SyncBadgeProps; navItems: NavItem[]; activePath: string; onNavigate?: (path: string) => void>{children}</AppShell>`
  - Quy tắc phân nhánh bố cục đúng `PROMPT.md §3.6`:
    - `student` và `parent`: luôn dùng `BottomNav` (tối đa 5 mục), **không** hiển thị `Sidebar` trái kể cả trên màn hình lớn.
    - Nhân viên trường (`teacher`, `dorm_staff`, `medical_staff`, `kitchen_staff`, `admin`): hiển thị `BottomNav` trên di động (`lg:hidden`) và tự chuyển sang `Sidebar` cố định bên trái từ `>= 1024px` (`hidden lg:flex`).

- [ ] **Step 1: Viết unit test đỏ (`src/components/layout/AppShell.test.tsx`)**

Kiểm tra:
1. `AppShell` luôn render đúng 1 `TribalStripe` ở mép trên `AppHeader` và hiển thị `SyncBadge`.
2. Với `role="student"` hoặc `role="parent"`, không render `aside` sidebar trái; `BottomNav` cắt giới hạn tối đa 5 mục.
3. Với `role="dorm_staff"` hoặc `role="teacher"`, render cả `Sidebar` (`hidden lg:flex`) cho máy tính và `BottomNav` (`lg:hidden`) cho điện thoại.

- [ ] **Step 2: Chạy test xác nhận đỏ**

Run: `npm run test -- src/components/layout/AppShell.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Triển khai `AppHeader`, `BottomNav`, `Sidebar`, `AppShell`, `HomeEntryPage` và `router.tsx`**

- Trong `src/app/router.tsx`, khai báo:
  - `/`: `HomeEntryPage` — hiển thị ngay bố cục **"Việc cần làm hôm nay"** (không có hero quảng cáo!) kèm thanh thông báo dev nhỏ dẫn sang `/dev/ui` để duyệt giao diện Giai đoạn 0.
  - `/dev/ui`: nạp qua `React.lazy(() => import('../dev/ui/StyleguidePage'))` bọc trong `<Suspense>` với `Skeleton`.

- [ ] **Step 4: Chạy test xác nhận xanh**

Run: `npm run test -- src/components/layout/AppShell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit Task 6**

```bash
git add src/components/layout src/app
git commit -m "feat(layout): implement role-adaptive AppShell with SyncBadge header and lazy router"
```

---

### Task 7: Trang Styleguide `/dev/ui`, 4 Màn hình Mẫu Thực tế, Kiểm thử E2E Playwright (360px & 1280px) & Cổng `verify`

**Files:**
- Create: `src/dev/ui/sampleData.ts`, `src/dev/ui/StyleguidePage.tsx`
- Create: `src/dev/ui/sections/FoundationsSection.tsx`, `src/dev/ui/sections/ActionsSection.tsx`, `src/dev/ui/sections/FormsSection.tsx`, `src/dev/ui/sections/FeedbackSection.tsx`
- Create: `src/dev/ui/previews/LoginPreview.tsx`, `src/dev/ui/previews/StudentTodayPreview.tsx`, `src/dev/ui/previews/ParentTodayPreview.tsx`, `src/dev/ui/previews/StaffDeskPreview.tsx`
- Create: `tests/e2e/styleguide.spec.ts`

**Interfaces:**
- Consumes: Toàn bộ primitives từ `src/components/ui/*`, `src/components/layout/AppShell.tsx`, `src/app/providers/*`
- Produces:
  - Route `/dev/ui` đầy đủ 5 khu vực kiểm duyệt trực quan + thanh công cụ chuyển đổi tức thời `SyncStatus` (`Đã đồng bộ` / `Đang chờ gửi 3 mục` / `Đang ngoại tuyến` / `Lỗi đồng bộ`) và công tắc `Chế độ Chữ lớn`.
  - Ảnh chụp màn hình tự động tại `docs/screenshots/gd0/` ở cả `360×800` và `1280×800`.

- [ ] **Step 1: Viết dữ liệu mẫu chuẩn PTDTNT (`src/dev/ui/sampleData.ts`) và các phân mục Styleguide + 4 màn hình mẫu**

Đảm bảo dữ liệu mẫu tuân thủ nghiêm ngặt `PROMPT.md §1, §3, §9` (tuyệt đối không lorem ipsum, không số liệu bịa):
- Trường mẫu: **Trường PTDTNT [TÊN TRƯỜNG]** · Hotline quản sinh `0218 3851 102` · Hotline y tế `0218 3851 115`.
- Học sinh mẫu: **Giàng A Páo** (Dân tộc Mông · Lớp `10A1` · Phòng `A204`, Dãy A), **Vàng Thị Dua** (`10A1`), **Triệu Văn Phú** (`11A2`), **Hoàng Thị Lan** (`10A1`).
- 4 màn hình mẫu tương tác được ngay trên `/dev/ui`:
  1. **Đăng nhập (`LoginPreview`):** Dải thổ cẩm mép trên & chân trang, nền đầu trang `forest-900` hiển thị tên **BẢN NHÀ**, 3 huy hiệu cam kết kỹ thuật (*Dùng được khi mất mạng*, *Một tài khoản cho cả trường*, *Nhẹ, chạy máy cấu hình thấp*), form nhập mã đăng nhập (`hs24001`) + mật khẩu, và đúng 4 bước hướng dẫn sử dụng.
  2. **Học sinh (`StudentTodayPreview`):** Mở thẳng vào *"Hôm nay của em"* (phiên tự học tối 19:30, thực đơn bữa tối: *Cơm trắng, thịt kho củ cải, đậu phụ sốt cà chua, canh rau cải*, đơn xin về cuối tuần đang chờ duyệt), nút giữ **SOS 2 giây**, và 3 thẻ nổi bật ★ (*Sổ liên lạc Bản – Trường*, *Gia sư AI buổi tối*, *Kho văn hóa Bản tôi*) trên nền `turmeric-50` viền `turmeric`.
  3. **Phụ huynh (`ParentTodayPreview`):** Bật chế độ Chữ lớn (`18px`, nút `52px`), thanh chuyển giữa 2 con (*Giàng A Páo — 10A1* và *Giàng Thị Mỷ — 11A2*), đúng 4 khối: *Điểm danh hôm nay*, *Sức khỏe*, *Lịch về nhà*, *Thông báo mới từ Thầy/Cô*.
  4. **Quản sinh (`StaffDeskPreview`):** Bố cục nhân viên trường (BottomNav ở 360px, Sidebar trái ở 1280px), phiên điểm danh tối đang mở (đã quét 12/14 học sinh, 1 em có phép), danh sách đơn xin về duyệt 1 chạm (*"Duyệt đơn"*, *"Từ chối"*).

- [ ] **Step 2: Viết kịch bản E2E Playwright (`tests/e2e/styleguide.spec.ts`) kiểm tra giao diện, không tràn ngang ở 360px, tương tác SOS/Dialog/Tabs và chụp ảnh minh chứng**

```ts
import { expect, test } from '@playwright/test';

test.describe('/dev/ui styleguide & role previews', () => {
  test('renders complete design system without horizontal overflow and captures screenshots', async ({
    page,
  }, testInfo) => {
    await page.goto('/dev/ui');
    await expect(page.getByRole('heading', { name: /Hệ thống giao diện BẢN NHÀ/i })).toBeVisible();

    // Ensure zero horizontal scrollbar on 360px low-end mobile screens
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);

    // Switch sync badge states interactively
    await page.getByRole('button', { name: 'Đang ngoại tuyến' }).click();
    await expect(page.getByText('Đang ngoại tuyến').first()).toBeVisible();

    // Verify 3 featured (★) cards exist with exact names
    await expect(page.getByText('★ Sổ liên lạc Bản – Trường').first()).toBeVisible();
    await expect(page.getByText('★ Gia sư AI buổi tối').first()).toBeVisible();
    await expect(page.getByText('★ Kho văn hóa Bản tôi').first()).toBeVisible();

    const suffix = testInfo.project.name; // mobile-360 or desktop-1280
    await page.screenshot({
      path: `docs/screenshots/gd0/styleguide-${suffix}.png`,
      fullPage: true,
    });

    // Switch through role screen previews and capture each
    for (const [tabName, slug] of [
      ['Đăng nhập', 'dang-nhap'],
      ['Học sinh', 'hoc-sinh'],
      ['Phụ huynh', 'phu-huynh'],
      ['Quản sinh', 'quan-sinh'],
    ] as const) {
      await page.getByRole('tab', { name: tabName }).click();
      const previewRegion = page.getByRole('tabpanel');
      await expect(previewRegion).toBeVisible();
      await previewRegion.screenshot({
        path: `docs/screenshots/gd0/${slug}-${suffix}.png`,
      });
    }
  });
});
```

- [ ] **Step 3: Cài trình duyệt Chromium cho Playwright và chạy E2E**

Run: `npx playwright install chromium && npm run test:e2e`
Expected: PASS trên cả 2 project `mobile-360` (`360×800`) và `desktop-1280` (`1280×800`), sinh đủ 10 file ảnh trong `docs/screenshots/gd0/`.

- [ ] **Step 4: Chạy rà soát mã nguồn (`/code-review` checklist) và cổng kiểm định cuối giai đoạn `npm run verify`**

Kiểm tra thủ công & tự động:
- Mọi file trong `src/` đều `< 300` dòng, không có `any`, không có emoji làm icon, không có gradient/glassmorphism, không có `TribalStripe` lọt vào trong `Card`/`Dialog`.
- Chạy lệnh tổng hợp:

Run: `npm run verify`
Expected:
- `eslint . && prettier --check .` → PASS (0 warnings, 0 errors)
- `tsc -b --noEmit` → PASS
- `vitest run` → PASS toàn bộ suites
- `vite build` → PASS, sinh PWA Service Worker (`dist/sw.js`, `dist/manifest.webmanifest`)
- `node scripts/check-budget.mjs` → PASS (`totalGzipBytes < 170KB`)

- [ ] **Step 5: Commit hoàn tất Giai đoạn 0 & Dừng báo cáo người dùng**

```bash
git add src/dev tests/e2e docs/screenshots/gd0
git commit -m "feat(styleguide): build /dev/ui component catalog, 4 role previews, and E2E visual verification"
```
