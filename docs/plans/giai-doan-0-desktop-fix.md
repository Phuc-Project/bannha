# Kế hoạch Nâng cấp Giao diện Desktop & Hoàn thiện Giai đoạn 0

> **Mục tiêu:** Biến giao diện Desktop (`≥ 1024px` / `1280px`) của **BẢN NHÀ** trở nên rõ ràng, có chiều sâu không gian làm việc (full-bleed Sidebar trái cho nhân viên trường, lưới 2 cột phân cấp cho mọi vai trò, bảng dữ liệu Desktop, trang `/dev/ui` có mục lục trái cố định & bộ so sánh Desktop ↔ Mobile 360px), đồng thời vá dứt điểm lỗi import trên `/dev/ui` và hoàn tất cổng `npm run verify` + Playwright E2E của Giai đoạn 0.

---

## 1. Chẩn đoán vấn đề hiện tại (từ mã nguồn thực tế)

1. **Khung `AppShell` cho Nhân viên chưa ra dáng Desktop app:**
   - Trong [`AppShell.tsx`](../../web/src/components/layout/AppShell.tsx), cả `AppHeader` lẫn `Sidebar` đang bị gói chung vào `max-w-6xl` căn giữa. Trên màn hình `1280px–1920px`, `Sidebar` bị hở khoảng trống bên trái thay vì neo sát mép trái toàn chiều cao (`full-height left rail`), và `Sidebar` hiện chỉ có tên app + 5 nút đơn sơ.
2. **Màn hình mặc định `/` (`HomeEntryPage.tsx`) khóa cứng ở layout hẹp kiểu di động:**
   - Mở `http://localhost:5173/` trên máy tính hiện chỉ thấy 1 cột hẹp `max-w-2xl` (`672px`), 1 banner, 1 card và 1 thanh `BottomNav` kéo dài sát đáy 1280px. Người dùng không thấy ngay giao diện Desktop của Quản sinh / Giáo viên hay sự khác biệt giữa các vai trò.
3. **Trang `/dev/ui` (`StyleguidePage.tsx`) bị đứt import & thiếu cấu trúc duyệt trên Desktop:**
   - `StyleguidePage.tsx` đang import `ActionsAndFormsSection` và `FeedbackAndOverlaysSection` (không tồn tại; các file thực tế là `ActionsSection`, `FormsSection`, `FeedbackSection`).
   - Toàn trang `/dev/ui` đổ dọc một luồng dài, chưa có thanh mục lục cố định bên trái trên Desktop và chưa có công tắc xem thử **Khổ Desktop ↔ Khổ Điện thoại 360px** trực tiếp.
4. **Màn mẫu vai trò chưa khai thác lưới 2 cột & bảng dữ liệu Desktop:**
   - `StaffDeskPreview` chưa có bảng duyệt đơn/điểm danh rõ cột trên máy tính và chưa có màn mẫu **Giáo viên chủ nhiệm nhập điểm dạng bảng** (vai trò dùng máy tính nhiều nhất theo `PROMPT.md §3.6 & §6.3`).
   - `StudentTodayPreview` và `ParentTodayPreview` bị bó vào 1 cột `max-w-2xl` trên desktop thay vì phân 2 cột hợp lý (việc chính bên trái, thẻ nổi bật ★ / SOS / thông báo bên phải).

---

## 2. Kiến trúc Giao diện Desktop sau khi nâng cấp

### 2.1 Bố cục Nhân viên trường (`teacher`, `dorm_staff`, `medical_staff`, `kitchen_staff`, `admin`) trên `≥ 1024px`

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ [TribalStripe 6px — mép trên toàn màn hình]                                │
├───────────────────────┬────────────────────────────────────────────────────┤
│ SIDEBAR TRÁI (264px)  │ WORKSPACE TOP BAR (surface trắng, viền dưới line)  │
│ Neo sát mép trái      │ Tiêu đề màn hình + ngữ cảnh ca trực | SyncBadge +  │
│ (sticky h-screen)     │ Nút Chữ lớn / Thao tác chính                       │
│                       ├────────────────────────────────────────────────────┤
│ [Khối Forest-900]     │ MAIN WORKSPACE (nền cream, max-w-7xl, padding 24)  │
│ BẢN NHÀ               │ ┌─────────────────────────────┬──────────────────┐ │
│ Trường PTDTNT         │ │ CỘT CHÍNH (xl:col-span-8)   │ CỘT PHỤ (4 cột)  │ │
│ Vai trò: Quản sinh    │ │ • Thanh tóm tắt ca trực     │ • Mở máy quét QR │ │
│ ───────────────────── │ │ • Bảng dữ liệu Desktop rõ   │ • Sự cố phòng    │ │
│ VẬN HÀNH HẰNG NGÀY    │ │   cột (DataTable)           │ • Trạng thái SOS │ │
│  ▸ Điểm danh QR       │ │ • Duyệt đơn 1 chạm          │                  │ │
│    Duyệt đơn phép (2) │ │                             │                  │ │
│    Sự cố phòng ở      │ │                             │                  │ │
│    Ghép đồ cũ         │ │                             │                  │ │
│    Trực SOS           │ │                             │                  │ │
│ ───────────────────── │ └─────────────────────────────┴──────────────────┘ │
│ Chân Sidebar:         │                                                    │
│ Nông Văn Toàn         │ (Dưới 1024px tự chuyển sang AppHeader Forest-900   │
│ Trực KTX: 0218...     │  + BottomNav 5 mục chuẩn điện thoại 360px)         │
└───────────────────────┴────────────────────────────────────────────────────┘
```

### 2.2 Bố cục Học sinh (`student`) & Phụ huynh (`parent`) trên `≥ 1024px`

- Giữ nguyên nguyên tắc `PROMPT.md §3.6` (không dùng Sidebar nhân viên, giữ thanh tab dưới tối đa 5 mục).
- Mở rộng vùng làm việc lên `max-w-5xl` (`1024px`) với **lưới 2 cột rõ phân cấp (`lg:grid-cols-12`, gap `20px`)**:
  - **Học sinh:** Cột trái (`7/12`): *Điểm danh tối nay*, *Bữa ăn tại nhà bếp*, *Lịch sử đơn xin phép*; Cột phải (`5/12`): *3 thẻ chức năng nổi bật ★* + *Khối SOS giữ 2 giây*.
  - **Phụ huynh (Chữ lớn 18px/52px):** Cột trái (`7/12`): *Chọn con*, *Điểm danh hôm nay*, *Sức khỏe*, *Lịch về bản*; Cột phải (`5/12`): *Thông báo mới từ Thầy/Cô (card ★)* + *Điểm tổng kết học kỳ I*.
- `BottomNav` trên `≥ 1024px` đóng khung gọn gàng ở đáy (`lg:max-w-xl lg:mx-auto lg:rounded-t-card lg:border-x`) thay vì kéo dải trắng trống trải hết màn hình rộng.

### 2.3 Thành phần mới & Cải tiến cụ thể

| Thành phần / Tệp | Thay đổi kỹ thuật |
|---|---|
| `web/src/components/layout/Sidebar.tsx` | Neo full-height (`lg:flex lg:w-[264px]`), đầu sidebar nhận diện **BẢN NHÀ** + vai trò, mục điều hướng hỗ trợ badge đếm số (ví dụ `2` đơn chờ), chân sidebar hiển thị người trực & hotline trường. |
| `web/src/components/layout/AppHeader.tsx` | Hỗ trợ 2 chế độ: **Mobile / Student-Parent** (`forest-900` có `TribalStripe`) và **Staff Desktop Topbar** (`surface` trắng sạch sẽ, viền `1px line`, `SyncBadge` nền sáng, tách biệt rõ với Sidebar trái). |
| `web/src/components/layout/AppShell.tsx` | Tách rõ 2 khung bố cục: **Staff Desktop Shell** (`TribalStripe` đỉnh → `Sidebar` trái sát mép + `TopBar` + `Main max-w-7xl`) và **Student/Parent Shell** (`AppHeader` + `Main max-w-5xl` + `BottomNav` đóng khung gọn trên Desktop). Bổ sung prop `forceViewport?: 'responsive' \| 'mobile'` để `/dev/ui` hiển thị được chế độ xem thử Điện thoại 360px ngay trên máy tính. |
| `web/src/components/ui/DataTable.tsx` | Component bảng dữ liệu responsive (chuẩn bị sẵn cho GĐ 2 & GĐ 3): trên Desktop hiển thị bảng `<table>` viền `1px line`, header `forest-50`, dòng gọn gàng có hover nhẹ; trên Mobile (`< 768px`) tự xếp thành các hàng thẻ không tràn ngang `360px`. |
| `web/src/dev/ui/previews/TeacherDeskPreview.tsx` | **Màn mẫu mới (Desktop-first):** Giáo viên chủ nhiệm `Cô Bùi Thị Hoa · Lớp 10A1` với Sidebar trái, bảng nhập điểm nhanh môn Toán (hỗ trợ ô số + trung bình) bên trái và khung gửi thông báo lớp / theo dõi phụ huynh đã đọc bên phải. |
| `web/src/dev/ui/previews/StaffDeskPreview.tsx` | Nâng cấp thành bàn làm việc Desktop 2 cột (`xl:grid-cols-12`): hàng tóm tắt trạng thái phiên điểm danh QR, bảng duyệt đơn 1 chạm (`DataTable`) bên trái và cột xử lý sự cố phòng + trực SOS bên phải. |
| `web/src/dev/ui/previews/StudentTodayPreview.tsx` & `ParentTodayPreview.tsx` | Chuyển sang lưới Desktop 2 cột `lg:grid-cols-12` thoáng, rõ thứ bậc thị giác mà vẫn thu gọn 1 cột mượt ở `360px`. |
| `web/src/app/HomeEntryPage.tsx` | Bổ sung thanh chuyển nhanh 4 góc nhìn vai trò (`Quản sinh · Desktop`, `Giáo viên · Desktop`, `Học sinh`, `Phụ huynh`) + nút mở `/dev/ui`, giúp mở `http://localhost:5173/` trên máy tính là kiểm tra được ngay giao diện Desktop đầy đủ. |
| `web/src/dev/ui/StyleguidePage.tsx` | Sửa lỗi import 4 section (`FoundationsSection`, `ActionsSection`, `FormsSection`, `FeedbackSection`), thêm **Sidebar mục lục cố định bên trái (240px)** trên Desktop `>= 1024px`, và nút gạt **Xem khổ Desktop ↔ Khổ Điện thoại 360px** cho cụm 5 màn hình mẫu vai trò. |

---

## 3. Các bước triển khai (theo đúng TDD & Gate kiểm định)

1. **Task A — Nâng cấp `AppShell`, `Sidebar`, `AppHeader`, `BottomNav` & `DataTable` (TDD):**
   - Cập nhật `AppShell.test.tsx` kiểm tra bố cục full-width Staff Desktop Shell (Sidebar trái + Topbar tách biệt) vs Student/Parent Shell (không Sidebar, `BottomNav` gọn) + viết `DataTable.test.tsx` (RED → GREEN).
   - Triển khai `DataTable.tsx` và nâng cấp `Sidebar.tsx`, `AppHeader.tsx`, `BottomNav.tsx`, `AppShell.tsx`.
2. **Task B — Nâng cấp 4 màn mẫu + thêm `TeacherDeskPreview` + cập nhật `/` (`HomeEntryPage`):**
   - Xây dựng `TeacherDeskPreview.tsx` (bảng điểm + thông báo lớp).
   - Nâng cấp `StaffDeskPreview.tsx`, `StudentTodayPreview.tsx`, `ParentTodayPreview.tsx`, `LoginPreview.tsx` sang lưới Desktop 2 cột sắc nét.
   - Nâng cấp `HomeEntryPage.tsx` có bộ chuyển vai trò trải nghiệm trực tiếp Desktop ngay tại `/`.
3. **Task C — Sửa & nâng cấp `/dev/ui` (`StyleguidePage`) + E2E Playwright & Verification:**
   - Sửa import section, thêm Sidebar mục lục trái cố định cho Desktop và công tắc chuyển đổi khung xem **Desktop ↔ Điện thoại 360px**.
   - Cập nhật `StyleguidePage.test.tsx` và `e2e/styleguide.spec.ts` chụp đủ ảnh minh chứng ở cả `1280×800` (Desktop) và `360×800` (Mobile) vào `docs/screenshots/gd0/` (gồm cả `giao-vien-desktop-1280.png`, `quan-sinh-desktop-1280.png`, `hoc-sinh-desktop-1280.png`, `phu-huynh-desktop-1280.png`, `styleguide-desktop-1280.png` và bản `360px`).
   - Chạy toàn bộ cổng kiểm định: `npm run format`, `npm run verify` (`lint` + `typecheck` + `test` + `build` + `check:budget < 170KB gzip`) và `npm run test:e2e`, mở ảnh chụp để kiểm tra trực quan rồi báo cáo kèm screenshot.

---

## 4. Ràng buộc an toàn không phá vỡ
- Giữ nguyên 100% 13 token màu WCAG AA (`≥ 4.5:1`), font `Be Vietnam Pro`, không gradient/glow/shadow card, chỉ đặt `TribalStripe` ở mép trên header, màn đăng nhập và footer.
- Giữ tổng JS khởi tạo `< 170KB gzip` (toàn bộ `StyleguidePage` và các màn mẫu `/dev/ui` tiếp tục tách chunk `React.lazy`).
- Không cài thêm thư viện ngoài danh sách đã duyệt.
