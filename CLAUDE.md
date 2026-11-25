# CLAUDE.md — Quy tắc dự án BẢN NHÀ

> **BẢN NHÀ** — *"Xa bản, vẫn có nhà. Một ứng dụng – mọi việc của đời sống nội trú."*
> Sản phẩm thực tế cho trường Phổ thông Dân tộc Nội trú (PTDTNT) vùng cao. Đối tượng sử dụng: học sinh dân tộc thiểu số, giáo viên chủ nhiệm, quản sinh, nhân viên y tế, nhà bếp, phụ huynh ở bản xa và quản trị trường trên điện thoại Android cấu hình thấp (Android 8+, RAM 2GB, màn hình 360px), mạng yếu hoặc mất sóng.
>
> Đặc tả gốc: [`PROMPT.md`](./PROMPT.md) · Giả định nghiệp vụ: [`docs/assumptions.md`](./docs/assumptions.md) · Kế hoạch từng giai đoạn: `docs/plans/giai-doan-<0..8>.md`.

---

## 1. Quy trình làm việc bắt buộc (ECC / Antigravity Gates)

Mỗi giai đoạn từ **GĐ 0 → GĐ 8** tuân thủ nghiêm ngặt 6 bước, **không đốt cháy giai đoạn**:

1. **Lập kế hoạch (`/plan` · `writing-plans` / `architecture-patterns`)**:
   - Viết kế hoạch chi tiết vào `docs/plans/giai-doan-<n>.md`.
   - **DỪNG LẠI chờ người dùng duyệt kế hoạch** trước khi viết code triển khai.
2. **TDD cho logic cốt lõi (`/tdd` · `test-driven-development`)**:
   - Bắt buộc viết test đỏ trước → code tối thiểu cho xanh → refactor cho: đồng bộ offline (`src/sync/`), chấm điểm ghép cặp đồ cũ, ký/kiểm tra HMAC thẻ QR, chính sách RLS Supabase, tính suất ăn & cắt suất tự động, kiểm độ tương phản WCAG AA, nút giữ SOS 2 giây.
3. **Kiểm duyệt CSDL & RLS (`database-reviewer` · checklist Supabase RLS)**:
   - Mọi migration trong `supabase/migrations/` phải bật RLS trên 100% bảng, dùng hàm `SECURITY DEFINER` trong schema `private` (`current_school_id()`, `has_role(text)`, `is_guardian_of(uuid)`, `is_homeroom_of(uuid)`), cô lập theo `school_id`, bảo vệ dữ liệu nhạy cảm (`health_*`, `item_requests`) và có test âm tính (bị chặn đúng quyền).
4. **Kiểm duyệt Bảo mật (`security-reviewer` · `backend-security-coder` / `frontend-security-coder`)**:
   - Kiểm tra mọi Edge Function (xác thực JWT + kiểm role + validate `zod`), upload Storage (private bucket + signed URL + giới hạn ≤ 5MB server / nén ≤ 300KB client), bảo vệ dữ liệu trẻ vị thành niên, không lộ `SUPABASE_SERVICE_ROLE_KEY` hay `ANTHROPIC_API_KEY` ở client, cấm `dangerouslySetInnerHTML`.
5. **Kiểm tra chất lượng cuối giai đoạn (`/code-review` → `/e2e` → `verify`)**:
   - Chạy rà soát mã nguồn (`code-reviewer` / `find-bugs`), chạy Playwright E2E ở 2 khung nhìn **360×800** và **1280×800**, chụp screenshot lưu minh chứng.
   - Chạy `npm run verify` (`lint` + `typecheck` + `test` + `build` + `check:budget`) — **tất cả phải xanh 100%**.
6. **Commit & Dừng chờ duyệt**:
   - Commit theo **Conventional Commits** (`feat:`, `fix:`, `test:`, `chore:`, `docs:`), mỗi tính năng một commit độc lập, rõ nghĩa.
   - **DỪNG LẠI sau mỗi giai đoạn**, gửi báo cáo gồm: những gì đã hoàn thành, ảnh chụp màn hình 360px & 1280px, số đo bundle gzip, và việc tồn đọng/kế tiếp.

> **Quy tắc xử lý mơ hồ:** Không hỏi lắt nhắt từng chi tiết nhỏ. Nếu gặp điểm chưa rõ về nghiệp vụ, ghi giả định hợp lý vào `docs/assumptions.md` rồi tiếp tục; chỉ dừng hỏi khi cần phê duyệt kế hoạch giai đoạn hoặc phát sinh thư viện ngoài danh sách.

---

## 2. Tech Stack cố định & Ngân sách hiệu năng

### Thư viện được phép (Whitelist)
- **Core SPA:** `vite`, `react@^18`, `react-dom@^18`, `typescript` (`strict: true`, cấm `any`), `react-router-dom` (lazy-load mọi route chức năng).
- **Styling & Font:** `tailwindcss` (token qua CSS variables), `@fontsource/be-vietnam-pro` (chỉ nạp weights `400`, `500`, `600`, `700`, tự host), `lucide-react` (`strokeWidth={1.75}`).
- **Offline & Backend:** `@supabase/supabase-js`, `dexie`, `dexie-react-hooks`, `vite-plugin-pwa` (Workbox).
- **Tiện ích nghiệp vụ:** `zod`, `date-fns` (kèm locale `vi`), `qrcode` + `@zxing/browser` (chỉ lazy-load ở màn tạo/quét QR), `browser-image-compression` (nén ≤ 300KB, cạnh dài ≤ 1280px trước khi lưu Dexie/upload).
- **Kiểm thử & Đo lường:** `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@playwright/test`, `rollup-plugin-visualizer`.
- **Accessibility Primitives:** Ưu tiên HTML bản địa (`<dialog>`, `<button>`, `<select>`); được phép dùng Radix primitives rời (`@radix-ui/react-*`) không kèm theme nếu thật sự cần, nhưng phải xin phép nếu phát sinh ngoài gói đã duyệt.

### Danh sách CẤM công nghệ
- ❌ **Cấm:** Next.js, SSR, Redux, Zustand ngoài luồng Dexie, `framer-motion`, MUI, Ant Design, Chakra UI, bộ theme mặc định của `shadcn/ui`.
- ❌ **Cấm tự ý cài thêm package** ngoài bảng trên khi chưa báo rõ lý do + dung lượng KB gzip và được người dùng đồng ý.

### Ngân sách & Tiêu chuẩn kỹ thuật
- **Initial JS Bundle:** **< 170KB gzip** (kiểm tự động qua `npm run check:budget`). Mỗi phân hệ trong `src/features/*` và `/dev/ui` tách chunk `React.lazy`.
- **Thiết bị mục tiêu:** Android 8+, RAM 2GB, màn hình 360px, mạng 3G/4G chập chờn hoặc offline hoàn toàn.
- **Lighthouse Mobile:** Performance ≥ 90, Accessibility ≥ 95, PWA installable.
- **Giới hạn mã nguồn:** Mỗi file **< 300 dòng**, hàm nhỏ đơn nhiệm, bất biến dữ liệu (immutable updates), không để `console.log` trong code sản phẩm, danh sách > 50 dòng phải phân trang hoặc tải dần.

### Biến môi trường (`.env.example`)
```ini
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_ACCOUNT_EMAIL_DOMAIN=bannha.internal
# Chỉ đặt trong Supabase Edge Function secrets — TUYỆT ĐỐI KHÔNG đưa vào client:
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
AI_MODEL=claude-haiku-5-5
AI_DAILY_LIMIT_PER_STUDENT=30
```

---

## 3. Hệ thống thiết kế (Design System) & Bản sắc vùng cao

### 3.1 Bảng màu (`src/styles/tokens.css`) & Quy tắc tương phản WCAG AA (≥ 4.5:1)

| CSS Variable | Mã Hex | Tỷ lệ tương phản chuẩn | Mục đích sử dụng đúng |
|---|---|---|---|
| `--color-forest-900` | `#163F33` | `11.71:1` với `#FFFFFF` · `10.87:1` với `#FAF6EE` | Header cố định, khối nhấn đậm, nút chính hover/active |
| `--color-forest-700` | `#1E5A47` | `8.05:1` với `#FFFFFF` · `6.94:1` với `#E8F0EC` | Nút hành động chính (Primary), icon mặc định, trạng thái chọn |
| `--color-forest-50` | `#E8F0EC` | Nền sáng (`12.74:1` với `ink`, `6.94:1` với `forest-700`) | Nền ô icon vuông 10px, nền chip mặc định |
| `--color-cream` | `#FAF6EE` | Nền toàn ứng dụng (`13.70:1` với `ink`) | Nền trang chính ấm áp, giảm chói mắt buổi tối |
| `--color-surface` | `#FFFFFF` | Nền thẻ (`14.77:1` với `ink`, `5.63:1` với `muted`) | Card, ô nhập liệu, thanh điều hướng, hộp thoại |
| `--color-line` | `#E7E0D2` | Viền cấu trúc 1px | Đường phân tách card, bảng, danh sách, viền input |
| `--color-clay-600` | `#B8431E` | `5.05:1` trên `cream` · `5.44:1` trên `surface` · `5.04:1` trên `turmeric-50` | Tiêu đề section (20px), icon của chức năng ★, cảnh báo nhẹ |
| `--color-turmeric` | `#E3B23C` | `5.97:1` trên `forest-900` · `7.53:1` với chữ `ink` (**`1.96:1` trên trắng — CẤM làm chữ trên nền sáng**) | Viền 1px của card nổi bật ★, viền huy hiệu trên nền `forest-900`, hoạ tiết thổ cẩm |
| `--color-turmeric-50` | `#FDF6E3` | `13.69:1` với `ink` · `5.04:1` với `clay-600` | Nền card 3 chức năng nổi bật ★ & ô icon ★ |
| `--color-ink` | `#1C2B25` | `13.70:1`–`14.77:1` trên mọi nền sáng | Chữ nội dung chính, tiêu đề thẻ |
| `--color-muted` | `#5B6B63` | `4.86:1` trên `forest-50` · `5.23:1` trên `cream` · `5.63:1` trên `surface` | Chữ phụ, chú thích thời gian, hướng dẫn trường nhập |
| `--color-danger` | `#C62828` | `5.62:1` với `#FFFFFF` · `5.22:1` trên `cream` | Nút SOS khẩn cấp, thông báo lỗi, trạng thái vắng không phép |
| `--color-success` | `#2E7D4F` | `5.05:1` với `#FFFFFF` · `4.68:1` trên `cream` (**`4.35:1` trên `forest-50` — dùng `forest-700` làm chữ trên `forest-50`**) | Trạng thái đã đồng bộ, đã duyệt, có mặt |

### 3.2 Kiểu chữ, Kích thước & Bố cục
- **Font:** `Be Vietnam Pro` (`400`, `500`, `600`, `700`). Tiêu đề `font-weight: 700`, `letter-spacing: -0.01em`.
- **Cỡ chữ:** Body tối thiểu **16px**, `line-height: 1.5`. Tiêu đề section **20px** màu `clay-600`, **không viết hoa toàn bộ (no ALL CAPS)**.
- **Chế độ "Chữ lớn" (`data-text-size="large"`):** Mặc định **BẬT** cho vai trò `parent`; body tăng lên **18px**, chiều cao nút/ô nhập tăng lên **52px**.
- **Nhịp lưới & Bo góc:** Hệ lưới `4px`; padding card `16px`, khoảng cách giữa các card `12px`; bo góc card `12px`, input/button `10px`, chip `999px`; vùng chạm tối thiểu **44×44px**.
- **Đổ bóng & Viền:** Phân tách hoàn toàn bằng viền `1px solid var(--color-line)`. **Không dùng shadow** trên card; chỉ `Sheet` (bottom sheet) và `Dialog` có shadow nhẹ.
- **Dải thổ cẩm (`TribalStripe`):** SVG pattern hình học tự vẽ (ô vuông, hình thoi xen kẽ đỏ đất – vàng nghệ – xanh rừng – kem), cao đúng **6px**. **Chỉ đặt tại 3 vị trí:** mép trên `AppHeader`, màn hình đăng nhập, và `Footer`. Cấm rải vào card hay hộp thoại.
- **3 chức năng nổi bật (★):** *Sổ liên lạc Bản – Trường*, *Gia sư AI buổi tối*, *Kho văn hóa Bản tôi* → dùng card nền `turmeric-50`, viền `turmeric`, icon đặt trong ô vuông bo `10px` nền `turmeric-50` màu `clay-600`.
- **Điều hướng theo vai trò:**
  - `student`, `parent`: Thanh tab dưới cùng (tối đa 5 mục).
  - Nhân viên trường (`teacher`, `dorm_staff`, `medical_staff`, `kitchen_staff`, `admin`): Tab dưới trên điện thoại, tự chuyển sang **Sidebar trái khi màn hình ≥ 1024px**.
  - Header cố định luôn hiển thị `SyncBadge` (chấm trạng thái + chữ rõ nghĩa, không bao giờ chỉ dùng màu).

### 3.3 Danh sách CẤM thẩm mỹ ("Chống mùi AI")
- ❌ Gradient tím/xanh neon, glassmorphism (`backdrop-blur`), mảng blob mờ, hiệu ứng phát sáng (glow), nền lưới chấm (dot grid).
- ❌ Dùng Emoji làm icon giao diện, ký tự `✨`, `🚀`, dòng chữ *"Powered by AI"*, *"Chào mừng bạn đến với…"*.
- ❌ Khối Hero khẩu hiệu chung chung sau khi đăng nhập — màn hình đầu tiên bắt buộc là **việc cần làm hôm nay**.
- ❌ Số liệu thống kê bịa đặt (*"10.000+ học sinh tin dùng"*), text giữ chỗ kiểu *"Tiêu đề ở đây"*, *lorem ipsum*.
- ❌ Lưới 3 card marketing giống hệt nhau; ảnh stock hoặc ảnh AI vẽ người cười.
- ❌ Animation nảy/bay rườm rà. Chỉ dùng transition `150–200ms` cho màu/opacity/transform nhỏ và bắt buộc tôn trọng `prefers-reduced-motion: reduce`.

### 3.4 Giọng văn giao diện
- Xưng hô đúng ngữ cảnh nội trú: gọi học sinh là **"em"**, phụ huynh là **"Phụ huynh"**, giáo viên là **"Thầy/Cô"**.
- Nhãn nút là **động từ cụ thể**: *"Gửi đơn xin về"*, *"Báo cắt suất"*, *"Đã nhận đồ"*, *"Tạo đơn xin phép"* — tuyệt đối không dùng *"OK"*, *"Submit"*.
- Trạng thái rỗng luôn kèm lời mời hành động trực tiếp, không vẽ hình minh họa dễ thương.
- Thông báo lỗi giải thích nguyên nhân + cách khắc phục: *"Chưa gửi được vì mất sóng. Đơn đã lưu, sẽ tự gửi khi có mạng."*

---

## 4. Kiến trúc Offline-First & Bảo mật dữ liệu

1. **Local-First tuyệt đối (`src/sync/`):**
   - Giao diện React **chỉ đọc từ IndexedDB qua Dexie (`useLiveQuery`)**, không fetch trực tiếp Supabase trong component.
   - Mọi thao tác thêm/sửa/xóa ghi ngay vào bảng Dexie cục bộ và xếp hàng vào `outbox` `{id, table, op, payload, created_at, attempts, last_error}`.
   - `Pull` theo con trỏ `last_pulled_at` (`updated_at > cursor`) khi mở app, có mạng lại (`online`), quay lại tab (`visibilitychange`), và định kỳ mỗi 60 giây.
   - `Push` tuần tự bằng `upsert` idempotent nhờ UUID sinh từ client (`crypto.randomUUID()`), exponential backoff tối đa 10 lần, quá hạn hiện nút *"Thử lại"*.
   - Ảnh chụp nén xuống `≤ 300KB`, `≤ 1280px`, lưu `Blob` trong Dexie khi offline, tự upload lên bucket private khi có sóng rồi cập nhật `photo_path`.
   - Khi **Đăng xuất**: xóa trắng toàn bộ cơ sở dữ liệu Dexie cục bộ để an toàn trên thiết bị dùng chung.
2. **Quy ước CSDL & Quyền riêng tư học sinh:**
   - Mọi bảng bắt buộc có `id uuid` (client sinh), `school_id`, `created_at`, `updated_at`, `deleted_at` (xóa mềm).
   - `item_requests` (nhu cầu xin nhận đồ cũ) **chỉ người tạo và quản sinh thấy** để giữ thể diện cho học sinh khó khăn.
   - Hồ sơ sức khỏe (`health_reports`, `health_checks`, `medical_reminders`) **chỉ** chính học sinh, phụ huynh của em, nhân viên y tế, quản sinh và GVCN của em được xem.
   - Giáo viên chỉ xem thống kê chủ đề Gia sư AI theo lớp, không đọc nội dung trò chuyện riêng tư của học sinh.

---

## 5. Cấu trúc thư mục chuẩn

```text
ban-nha/
├── web/                  # Frontend (Vite + React 18 + TypeScript PWA)
│   ├── public/           # favicon.svg, pwa-192x192.png, pwa-512x512.png
│   └── src/
│       ├── app/          # router, providers (TextSize, Toast, Auth), AppShell
│       ├── components/   # ui/ (Button, HoldButton, Card, TribalStripe...) & layout/
│       ├── dev/ui/       # Trang styleguide /dev/ui (React.lazy) + 4 màn mẫu vai trò
│       ├── features/     # dorm, kitchen, contact-book, tutor, health, donations, scholarships, culture, admin, auth
│       ├── sync/         # dexie db, pull, push, outbox, network status
│       ├── lib/          # supabase client, contrast, roles, date, image, qr, format
│       ├── content/      # career-quiz.json
│       └── styles/       # tokens.css, base.css, fonts.ts, palette.ts
├── supabase/             # Backend (migrations/, functions/, seed.sql, tests/ RLS)
├── e2e/                  # Kiểm thử Playwright E2E (360px & 1280px)
├── scripts/              # gen-icons.mjs, check-budget.mjs, seed.mjs, gen-types.mjs
└── docs/                 # plans/ (giai-doan-0..8.md), assumptions.md, screenshots/
```

---

## 6. Lệnh phát triển chuẩn

- `npm run dev` — Chạy Vite dev server (xem Styleguide tại `/dev/ui`).
- `npm run lint` — Kiểm tra ESLint + định dạng Prettier.
- `npm run typecheck` — Kiểm tra `tsc -b --noEmit` (`strict`).
- `npm run test` — Chạy toàn bộ unit & component test với Vitest.
- `npm run build` — Build production PWA + xuất báo cáo kích thước gói `dist/stats.html`.
- `npm run check:budget` — Kiểm tra tổng JS khởi tạo `< 170KB gzip`.
- `npm run test:e2e` — Chạy Playwright E2E trên cấu hình mobile `360px` & desktop `1280px`.
- `npm run verify` — Chạy tuần tự `lint` + `typecheck` + `test` + `build` + `check:budget`.

---

## 7. Ngoài phạm vi (Out of Scope)

Không làm ứng dụng native iOS/Android riêng, không tích hợp cổng thanh toán, không có nhắn tin 2 chiều giữa người dùng, không có bình luận dưới bài viết văn hóa, không gửi SMS qua nhà mạng, không đa ngôn ngữ (chỉ dùng tiếng Việt chuẩn, rõ ràng).
