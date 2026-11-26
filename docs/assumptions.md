# Giả định Nghiệp vụ & Kỹ thuật (`assumptions.md`)

Tài liệu này ghi nhận các quyết định làm rõ chi tiết kỹ thuật và nghiệp vụ trong quá trình xây dựng **BẢN NHÀ**, tuân thủ nguyên tắc tại `PROMPT.md §0`: *ghi rõ giả định hợp lý và tiếp tục thay vì dừng hỏi lắt nhắt*.

---

## Giai đoạn 0 — Khởi tạo, Hệ thống thiết kế & Styleguide (`/dev/ui`)

1. **Ánh xạ quy trình ECC trên môi trường phát triển hiện tại:**
   - Đặc tả gốc tham chiếu bộ lệnh `everything-claude-code` (`/plan`, `/tdd`, `database-reviewer`, `security-reviewer`, `/code-review`, `/e2e`, `/build-fix`). Trong môi trường làm việc hiện tại, quy trình 6 cổng kiểm soát tương đương được thực thi đầy đủ thông qua các skill chuyên biệt (`writing-plans`, `test-driven-development`, `api-backend-engineering` + Supabase RLS checklist, `backend-security-coder` / `frontend-security-coder`, `code-reviewer`, `webapp-testing` + Playwright, và `npm run verify`).

2. **Xử lý đường dẫn thư mục Windows chứa dấu tiếng Việt tổ hợp (NFD `d:\bản nhà`):**
   - Thư mục gốc trên Windows sử dụng chuỗi Unicode tổ hợp NFD (`ba\u0309n nha\u0300`). Để tránh lỗi giải mã phần trăm URL (`%CC%89`) và lỗi scanner native trên Windows:
     - Mọi script Node (`vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `scripts/*.mjs`) bắt buộc dùng `fileURLToPath(import.meta.url)` và `path.resolve` thay vì `new URL(...).pathname`.
     - Sử dụng `tailwindcss@^3.4` qua PostCSS (thuần Node.js `fs`) để đảm bảo quét class ổn định 100% trên đường dẫn Unicode NFD và tương thích tối đa với CSS variables trên trình duyệt Android 8+ (Chrome WebView cũ không hỗ trợ `@property` hay `color-mix(in oklab, ...)` của Tailwind v4).

3. **Quy tắc màu chữ đảm bảo WCAG AA (≥ 4.5:1) tuyệt đối:**
   - Qua kiểm tra toán học độ chói tương đối WCAG 2.1 cho 13 token màu trong `PROMPT.md §3.1`:
     - `--color-turmeric` (`#E3B23C`) trên nền sáng (`#FFFFFF` đạt `1.96:1`, `#FDF6E3` đạt `1.81:1`) **không đủ chuẩn làm màu chữ**. Do đó `#E3B23C` chỉ dùng cho **viền 1px** của card nổi bật ★, dải thổ cẩm, hoặc chữ/viền trên nền tối `--color-forest-900` (`#163F33`, đạt `5.97:1`). Chữ trên nền `--color-turmeric` dùng `--color-ink` (`#1C2B25`, đạt `7.53:1`); icon trong ô `--color-turmeric-50` dùng `--color-clay-600` (`#B8431E`, đạt `5.04:1`).
     - `--color-success` (`#2E7D4F`) đạt `5.05:1` trên `#FFFFFF` và `4.68:1` trên `#FAF6EE`, nhưng chỉ đạt `4.35:1` trên `--color-forest-50` (`#E8F0EC`). Vì vậy nhãn chữ đặt trên nền `--color-forest-50` dùng `--color-forest-700` (`#1E5A47`, đạt `6.94:1`) hoặc `--color-ink` (`12.74:1`), còn `--color-success` dùng cho chấm biểu tượng, nền huy hiệu đặc chữ trắng (`5.05:1`), hoặc chữ trên nền `surface`/`cream`.

4. **Ưu tiên HTML `<dialog>` chuẩn thay vì cài thêm gói UI nặng ở Giai đoạn 0:**
   - Thành phần `Dialog` và `Sheet` (Bottom Sheet) được xây dựng trực tiếp trên thẻ `<dialog>` chuẩn của HTML5 (hỗ trợ từ Android WebView 37+, nhẹ 0 KB gzip, hỗ trợ phím `Escape`, khóa cuộn, hoàn trả focus và đầy đủ thuộc tính ARIA) nhằm giữ tổng JS khởi tạo thấp nhất có thể cho thiết bị RAM 2GB và nằm sâu dưới ngưỡng `< 170KB gzip`.

5. **Cơ chế mặc định và ghi nhớ "Chế độ Chữ lớn" (`TextSizeProvider`):**
   - Khi người dùng mang vai trò `parent`, chế độ Chữ lớn (`18px` body, nút `52px`) tự động bật mặc định nếu người dùng chưa từng tự tay chuyển đổi trong `localStorage` (`bannha.textSize`). Nếu phụ huynh hoặc người dùng vai trò khác chủ động bật/tắt công tắc Chữ lớn, lựa chọn thủ công đó được tôn trọng và lưu cục bộ.

6. **Tách chunk trang `/dev/ui` khỏi gói tải ban đầu:**
   - Trang `/dev/ui` chứa toàn bộ danh mục component và 4 màn hình mẫu theo vai trò phục vụ duyệt giao diện nên được nạp qua `React.lazy`. Nhờ đó người dùng thật trên điện thoại yếu khi vào màn hình chính (`/`) không phải tải mã nguồn của trang styleguide.

7. **Tổ chức kho mã nguồn 5 phân vùng cấp cao (`ban-nha/`):**
   - Theo chỉ định kiến trúc của người dùng, dự án chia làm 5 thư mục gốc rõ ràng: `web/` (Frontend Vite + React PWA), `supabase/` (migrations, RLS, Edge Functions, RLS tests), `e2e/` (Playwright E2E), `scripts/` (sinh icon, kiểm tra bundle budget, seed tài khoản mẫu, sinh type), và `docs/` (kế hoạch, quyết định kỹ thuật, ảnh chụp minh chứng). Sử dụng npm workspaces (`"workspaces": ["web"]`) ở thư mục gốc để dùng chung một `node_modules` duy nhất, không nhân đôi dung lượng ổ đĩa.

7. **Tổ chức kho mã nguồn 5 thư mục cấp cao (`web/`, `supabase/`, `e2e/`, `scripts/`, `docs/`):**
   - Theo chỉ định kiến trúc của người dùng, dự án dùng npm workspaces với `web/` chứa toàn bộ mã nguồn Vite + React PWA, `supabase/` chứa migrations/RLS/Edge Functions/tests, `e2e/` chứa cấu hình và kịch bản Playwright, `scripts/` chứa các công cụ dòng lệnh dùng chung (`gen-icons.mjs`, `check-budget.mjs`, và ở GĐ 1 thêm `seed.mjs`, `gen-types.mjs`), và `docs/` lưu kế hoạch, quyết định kỹ thuật cùng ảnh chụp kiểm chứng. File `.env` đặt tại thư mục gốc dự án được Vite đọc qua `envDir: '..'` để dùng chung nhất quán giữa `web/` và `scripts/`.

8. **Chỉnh hướng Desktop-first thực thụ & thẩm mỹ Sổ công tác (theo phản hồi duyệt GĐ 0 của người dùng):**
   - Tách rạch ròi ngưỡng Desktop (`≥ 768px`) và Mobile (`< 768px`, kích hoạt trên điện thoại thật hoặc khi bấm F12 DevTools): trên Desktop (`≥ 768px`) **ẩn tuyệt đối `BottomNav`** cho mọi vai trò và dùng thanh điều hướng Sidebar xanh rừng cố định bên trái; chỉ khi `< 768px` mới hiển thị giao diện Mobile + thanh tab dưới đáy.
   - Bỏ phong cách "SaaS card kit / pill chấm tròn" rập khuôn: giảm bo góc (`8px` cho khung, `6px` cho nút/input), dùng mật độ hàng bảng thực dụng trên Desktop (`36px–40px` cho nút/dòng trên máy tính, giữ `≥ 44px` trên di động `< 768px`), thay các cụm 3 ô KPI rời rạc bằng thanh số liệu kẻ vạch dọc `1px`, và đặt bộ chuyển vai trò thử nghiệm gọn ở chân Sidebar thay vì hiển thị card hướng dẫn giữa trang.
