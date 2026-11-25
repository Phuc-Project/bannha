# PROMPT DỰ ÁN: BẢN NHÀ — Ứng dụng hỗ trợ học sinh dân tộc nội trú

> **Cách dùng:** Đặt file này ở thư mục gốc dự án (đổi tên thành `PROMPT.md`), rồi nói với Claude Code:
> *"Đọc kỹ PROMPT.md, tạo CLAUDE.md cho dự án từ nội dung đó, rồi bắt đầu Giai đoạn 0. Dừng lại sau mỗi giai đoạn để tôi duyệt."*

---

## 0. Vai trò của bạn và cách làm việc

Bạn là **senior full-stack engineer kiêm product designer**, đang xây một sản phẩm thật sẽ được dùng ở trường Phổ thông Dân tộc Nội trú (PTDTNT) vùng cao — không phải bản demo. Người dùng là học sinh dân tộc thiểu số, giáo viên/quản sinh và phụ huynh ở bản xa, nhiều người dùng điện thoại Android cấu hình thấp, sóng yếu hoặc mất sóng.

### Bắt buộc dùng plugin Everything Claude Code (ECC)
- Đầu phiên, chạy `/plugin list everything-claude-code@everything-claude-code` để xem các lệnh/agent/skill đang có. Nếu tên lệnh khác với bên dưới (ví dụ có tiền tố `/everything-claude-code:`), dùng tên tương ứng.
- Quy trình cho **mỗi giai đoạn**:
  1. `/plan` (agent **planner**/**architect**) → viết kế hoạch vào `docs/plans/<giai-doan>.md`, **chờ tôi duyệt** rồi mới code.
  2. Logic quan trọng (sync offline, ghép cặp đồ cũ, kiểm tra QR, RLS, tính suất ăn) làm theo `/tdd`: viết test trước.
  3. Mọi migration/RLS phải qua agent **database-reviewer** (có chuyên về Supabase).
  4. Edge Function, auth, upload file phải qua agent **security-reviewer**.
  5. Cuối giai đoạn: `/code-review`, rồi `/e2e` (Playwright) cho các luồng chính, `/build-fix` nếu build lỗi, cuối cùng chạy verify (lint + typecheck + test + build) phải xanh.
  6. Commit theo Conventional Commits, mỗi tính năng một commit rõ ràng.
- Dùng các skill **frontend/design patterns**, **backend-patterns**, **coding-standards** của ECC khi có.
- Không tự ý thêm thư viện ngoài danh sách ở mục 2. Nếu thật sự cần, hỏi tôi kèm lý do và dung lượng (KB gzip).

### Nguyên tắc chung
- Tiếng Việt cho toàn bộ giao diện, comment code bằng tiếng Anh ngắn gọn.
- Code TypeScript `strict`, không `any`. Hàm nhỏ, file < 300 dòng.
- Không dùng dữ liệu giả kiểu lorem ipsum. Dữ liệu mẫu phải giống thật (xem mục 9).
- Khi không chắc về nghiệp vụ, ghi giả định vào `docs/assumptions.md` và tiếp tục, đừng dừng lại hỏi từng chút.

---

## 1. Bối cảnh sản phẩm

**Tên:** BẢN NHÀ — *"Xa bản, vẫn có nhà. Một ứng dụng – mọi việc của đời sống nội trú."*

**Vấn đề:**
- **Xa gia đình:** học sinh ở trường cả tuần, phụ huynh ở bản ít nắm được tình hình học tập, sinh hoạt của con.
- **Thiếu điều kiện:** nhiều em khó khăn, thiếu sách vở, đồng phục, áo ấm; tự học buổi tối không có người hỏi bài.
- **Quản lý thủ công:** điểm danh, xin phép, báo cắt suất ăn vẫn làm bằng sổ sách, giấy tờ.

**3 cam kết kỹ thuật (hiển thị như "huy hiệu" trên trang giới thiệu):**
1. **Dùng được khi mất mạng** — mọi thao tác chính hoạt động offline, tự đồng bộ khi có sóng.
2. **Một tài khoản cho cả trường** — nhà trường cấp tài khoản, không tự đăng ký.
3. **Nhẹ, chạy máy cấu hình thấp** — Android 8+, RAM 2GB, màn hình 360px.

**Người dùng:**
| Vai trò | Mã role | Việc chính |
|---|---|---|
| Học sinh | `student` | Học tập, xin phép, báo ốm, nhận đồ — tất cả trên một chiếc điện thoại |
| Giáo viên chủ nhiệm | `teacher` | Nhập điểm, gửi thông báo, duyệt đơn, đăng chủ đề bài học |
| Quản sinh | `dorm_staff` | Điểm danh nhanh, duyệt đơn, xử lý sự cố phòng, nhận SOS |
| Nhân viên y tế | `medical_staff` | Theo dõi sức khỏe, xử lý báo ốm, nhắc lịch khám |
| Nhà bếp | `kitchen_staff` | Nhập thực đơn, xem số suất từng bữa |
| Phụ huynh ở bản | `parent` | Xem điểm danh, kết quả học tập, lịch về nhà, nhận thông báo |
| Quản trị trường | `admin` | Tạo lớp/phòng, cấp tài khoản, in thẻ QR |

**Cách dùng (luồng onboarding 4 bước, hiển thị đúng như vậy):**
1. Đăng nhập bằng tài khoản trường cấp
2. Chọn vai trò (chỉ hiện nếu tài khoản có >1 vai trò, ví dụ giáo viên kiêm quản sinh)
3. Dùng mọi chức năng, kể cả khi mất mạng
4. Tự đồng bộ khi có sóng

---

## 2. Tech stack (giữ thật đơn giản)

| Phần | Lựa chọn | Ghi chú |
|---|---|---|
| Build | **Vite + React 18 + TypeScript** | SPA, không SSR |
| Style | **Tailwind CSS** | Token màu khai báo trong CSS variables |
| Router | **React Router** | Lazy-load theo route |
| Backend | **Supabase** (Postgres, Auth, Storage, Realtime, Edge Functions) | Không có server riêng |
| Offline | **Dexie.js** (IndexedDB) + `dexie-react-hooks` | Local-first: UI đọc từ Dexie |
| PWA | **vite-plugin-pwa** (Workbox) | Cài lên màn hình chính, cache app shell |
| Validate | **zod** | Dùng chung cho form và Edge Function |
| Icon | **lucide-react** | Stroke 1.75 |
| Ngày giờ | **date-fns** + locale `vi` | |
| QR | `qrcode` (tạo) + `@zxing/browser` (quét) | Lazy-load chỉ ở màn quét |
| Ảnh | `browser-image-compression` | Nén ≤ 300KB, tối đa 1280px trước khi upload |
| Font | **Be Vietnam Pro** qua `@fontsource/be-vietnam-pro` | Chỉ 400/500/600/700, tự host |
| Test | **Vitest** + Testing Library, **Playwright** cho E2E | |
| Deploy | Vercel hoặc Netlify (static) | |

**Không dùng:** Next.js, Redux, framer-motion, thư viện UI có sẵn theme (MUI, Ant, Chakra), theme mặc định của shadcn. Được phép dùng **Radix primitives** riêng lẻ (Dialog, Popover, Tabs) nếu cần cho accessibility, nhưng tự style hoàn toàn.

**Biến môi trường** (`.env.example`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=      # hoặc anon key
VITE_ACCOUNT_EMAIL_DOMAIN=bannha.internal
# Chỉ đặt trong Supabase secrets, KHÔNG đưa vào client:
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
AI_MODEL=claude-haiku-5-5
AI_DAILY_LIMIT_PER_STUDENT=30
```

---

## 3. Thiết kế giao diện — chuyên nghiệp, ấm áp, KHÔNG "mùi AI"

Bản sắc lấy từ poster dự án: nền kem, xanh rừng đậm, chữ tiêu đề đỏ đất, điểm nhấn vàng nghệ, dải họa tiết thổ cẩm.

### 3.1 Design tokens
```css
--color-forest-900: #163F33;   /* header, nút chính đậm */
--color-forest-700: #1E5A47;   /* primary */
--color-forest-50:  #E8F0EC;   /* nền icon, chip */
--color-cream:      #FAF6EE;   /* nền app */
--color-surface:    #FFFFFF;   /* card */
--color-line:       #E7E0D2;   /* viền 1px */
--color-clay-600:   #B8431E;   /* tiêu đề section, cảnh báo nhẹ */
--color-turmeric:   #E3B23C;   /* nhấn chức năng nổi bật ★, viền card nổi bật */
--color-turmeric-50:#FDF6E3;   /* nền card nổi bật */
--color-ink:        #1C2B25;   /* chữ chính */
--color-muted:      #5B6B63;   /* chữ phụ */
--color-danger:     #C62828;   /* SOS, lỗi */
--color-success:    #2E7D4F;
```
Kiểm tra mọi cặp màu chữ/nền đạt **WCAG AA (≥ 4.5:1)**.

### 3.2 Typography & khoảng cách
- Be Vietnam Pro. Tiêu đề 700, `letter-spacing: -0.01em`. Body **16px tối thiểu**, line-height 1.5. Chế độ "Chữ lớn" (mặc định bật cho phụ huynh): body 18px, nút cao 52px.
- Lưới 4px. Card padding 16px, khoảng cách giữa card 12px.
- Bo góc: card 12px, input/nút 10px, chip 999px.
- Phân tách bằng **viền 1px `--color-line`**, gần như không dùng shadow. Chỉ bottom sheet và dialog có shadow nhẹ.

### 3.3 Chi tiết tạo bản sắc
- **Dải thổ cẩm:** tự vẽ một SVG pattern hình học (ô vuông, hình thoi xen kẽ đỏ đất – vàng nghệ – xanh rừng – kem), cao 6px. Chỉ dùng ở mép trên header, màn đăng nhập và footer. Không rải khắp nơi.
- **Icon:** Lucide đặt trong ô vuông bo 10px, nền `forest-50` (hoặc `turmeric-50` với chức năng ★), giống poster.
- **Chức năng nổi bật (★):** Sổ liên lạc Bản – Trường, Gia sư AI buổi tối, Kho văn hóa Bản tôi → card nền `turmeric-50`, viền `turmeric`.
- Tiêu đề section màu `clay-600`, kích thước 20px, không viết hoa toàn bộ.

### 3.4 Danh sách CẤM (để không bị "mùi AI")
- ❌ Gradient tím/xanh neon, glassmorphism, blob mờ, glow, nền lưới chấm.
- ❌ Emoji làm icon, ký tự ✨🚀, chữ "Powered by AI", "Chào mừng bạn đến với…".
- ❌ Hero to đùng với câu khẩu hiệu chung chung. Màn hình đầu tiên phải là **việc cần làm hôm nay**.
- ❌ Số liệu thống kê bịa ("10.000+ học sinh tin dùng").
- ❌ Lưới 3 card giống hệt nhau chỉ có icon + tiêu đề + mô tả lặp lại.
- ❌ Animation bay nhảy. Chỉ transition 150–200ms cho màu/opacity/transform nhỏ, tôn trọng `prefers-reduced-motion`.
- ❌ Ảnh stock/ảnh AI tạo người cười. Dùng ảnh do người dùng đăng hoặc không dùng ảnh.
- ❌ Text giữ chỗ kiểu "Tiêu đề ở đây".

### 3.5 Giọng văn
- Ngắn, rõ, gần gũi; gọi học sinh là **"em"**, gọi phụ huynh là **"Phụ huynh"**, gọi giáo viên là **"Thầy/Cô"**.
- Nút là động từ cụ thể: "Gửi đơn xin về", "Báo cắt suất", "Đã nhận đồ" — không dùng "OK", "Submit".
- Trạng thái rỗng phải có hành động: "Chưa có đơn nào. **Tạo đơn xin phép**" — không vẽ minh họa dễ thương.
- Thông báo lỗi nói cách khắc phục: "Chưa gửi được vì mất sóng. Đơn đã lưu, sẽ tự gửi khi có mạng."

### 3.6 Bố cục
- **Mobile-first.** Học sinh & phụ huynh: thanh tab dưới cùng (tối đa 5 mục). Nhân viên trường: tab dưới trên điện thoại, **sidebar trái khi ≥ 1024px** (thầy cô hay dùng máy tính).
- Header cố định có **chỉ báo đồng bộ**: "Đã đồng bộ 2 phút trước" / "Đang chờ gửi 3 mục" / "Đang ngoại tuyến" (chấm màu + chữ, không chỉ màu).
- Vùng chạm tối thiểu 44×44px.
- Trước khi làm tính năng, tạo trang **`/dev/ui`** (styleguide) hiển thị toàn bộ component để tôi duyệt giao diện.

---

## 4. Tài khoản & phân quyền

- Không có đăng ký công khai. Admin tạo tài khoản (từng người hoặc **import CSV**) qua Edge Function `admin-create-users` (dùng service role, kiểm tra người gọi là `admin` cùng trường).
- Đăng nhập bằng **mã đăng nhập + mật khẩu** (ví dụ `hs24001`). Ở client, ghép thành email `<mã>@<VITE_ACCOUNT_EMAIL_DOMAIN>` để dùng Supabase Auth email/password; `email_confirm: true`, không gửi email.
- Lần đầu đăng nhập bắt buộc đổi mật khẩu. Admin có nút "Đặt lại mật khẩu".
- Một người có thể có nhiều vai trò (`roles text[]`), ví dụ giáo viên kiêm quản sinh → màn chọn vai trò, lưu lựa chọn gần nhất.
- Phiên đăng nhập phải dùng được offline (session lưu local, chỉ refresh token khi có mạng).
- Admin in **thẻ QR học sinh** (trang in A4, 8 thẻ/trang, có tên, lớp, phòng, ảnh nếu có).

---

## 5. Cơ sở dữ liệu Supabase

Viết bằng migration trong `supabase/migrations/`, dùng Supabase CLI. Mọi bảng có `id uuid` (**client tự sinh UUID** để đồng bộ offline không trùng), `school_id`, `created_at`, `updated_at` (trigger tự cập nhật), `deleted_at` (xóa mềm để đồng bộ được việc xóa). Sinh type bằng `supabase gen types typescript`.

### 5.1 Bảng
**Nền tảng**
- `schools` (name, code, address, dorm_hotline, medical_hotline, meal_cancel_cutoff_hour)
- `profiles` (id = auth.users.id, username, full_name, roles text[], phone, ethnicity, avatar_url, class_id, room_id, must_change_password)
- `classes` (name, grade, homeroom_teacher_id)
- `dorm_rooms` (building, name, capacity)
- `guardian_links` (parent_id, student_id, relation)
- `notifications` (user_id, type, title, body, link, read_at)
- `announcements` (audience: `all|students|parents|class|student`, class_id, student_id, title, body, created_by) + `announcement_reads` (announcement_id, user_id, read_at)

**1. Ký túc xá số**
- `attendance_sessions` (kind: `morning|evening_study|night_check`, date, building, created_by, closed_at)
- `attendance_records` (session_id, student_id, status: `present|late|absent|excused`, method: `qr|manual`, recorded_at, recorded_by)
- `leave_requests` (student_id, created_by, kind: `go_home|sick|other`, from_at, to_at, reason, status: `pending|approved|rejected`, reviewed_by, reviewed_at, review_note)
- `room_issues` (room_id, reported_by, category: `electric|water|door_window|bed|other`, description, photo_path, status: `open|in_progress|resolved`)

**2. Bếp ăn minh bạch**
- `menus` (date, meal: `breakfast|lunch|dinner`, dishes text[], note, photo_path)
- `meal_cancellations` (student_id, date, meal, source: `manual|leave_request`, leave_request_id)
- `dish_suggestions` (student_id, name, ethnicity, description, status: `new|planned|served`) + `dish_votes` (suggestion_id, student_id)

**3. Sổ liên lạc Bản – Trường ★**
- `grades` (student_id, subject, term, kind: `oral|15min|45min|midterm|final`, score numeric(4,2), recorded_by)
- Dùng lại `attendance_records`, `leave_requests`, `announcements`.

**4. Gia sư AI buổi tối ★**
- `lesson_topics` (class_id, subject, week_start, title, summary, created_by)
- `tutor_sessions` (student_id, subject, lesson_topic_id nullable)
- `tutor_messages` (session_id, role: `user|assistant`, content, image_path, created_at)
- `tutor_usage` (student_id, date, count)

**5. Y tế học đường**
- `health_reports` (student_id, symptoms text[], temperature, note, status: `new|seen|handled`, handled_by, handled_note)
- `health_checks` (student_id, height_cm, weight_kg, measured_at, note)
- `medical_reminders` (student_id, title, due_at, done_at)
- `sos_alerts` (student_id, location_note, created_at, acknowledged_by, acknowledged_at)

**6. Ngân hàng đồ cũ**
- `donation_items` (donor_id, category: `textbook|uniform|winter_clothes|school_supplies|other`, title, grade, size, condition: `like_new|good|used`, photo_path, status: `available|reserved|given`)
- `item_requests` (requester_id, category, grade, size, note, status: `open|matched|fulfilled|cancelled`)
- `item_matches` (item_id, request_id, matched_by, status: `proposed|handed_over`, handed_over_at)

**7. Học bổng & hướng nghiệp**
- `scholarships` (title, provider, amount_text, eligibility, for_ethnic_minority bool, grades int[], deadline, apply_link, created_by)
- `scholarship_bookmarks` (student_id, scholarship_id)
- `articles` (category: `admission_policy|career|guide`, title, body_md, published)
- `career_results` (student_id, answers jsonb, top_groups text[])

**8. Kho văn hóa Bản tôi ★**
- `culture_posts` (author_id, ethnicity, category: `costume|festival|food|custom|language|craft`, title, body, photo_paths text[], status: `pending|published|rejected`, reviewed_by)
- `culture_likes` (post_id, user_id)

### 5.2 RLS (bắt buộc bật cho MỌI bảng)
Tạo hàm `security definer` trong schema `private`: `current_school_id()`, `has_role(text)`, `is_guardian_of(uuid)`, `is_homeroom_of(uuid)`. Nguyên tắc:
- Mọi truy vấn giới hạn trong `school_id` của người dùng.
- **Học sinh:** chỉ đọc/ghi dữ liệu của chính mình (đơn, báo ốm, điểm, tutor). Đọc được menu, thông báo, học bổng, bài văn hóa đã duyệt, đồ cũ đang `available` (không thấy ai là người cho).
- **Phụ huynh:** chỉ đọc dữ liệu của con mình (qua `guardian_links`); được tạo `leave_requests` cho con.
- **Giáo viên:** đọc/ghi điểm, thông báo của lớp mình chủ nhiệm.
- **Quản sinh:** điểm danh, đơn xin phép, sự cố phòng, SOS, ghép đồ cũ toàn trường.
- **Y tế:** dữ liệu sức khỏe toàn trường. **Dữ liệu sức khỏe chỉ** học sinh đó, phụ huynh của em, y tế, quản sinh và GVCN được xem.
- **`item_requests` (nhu cầu nhận đồ) chỉ người tạo và quản sinh thấy** — giữ thể diện cho học sinh khó khăn.
- Viết test RLS (Vitest + Supabase local) đăng nhập bằng từng tài khoản seed và kiểm tra cả trường hợp **bị chặn**.

### 5.3 Storage
Bucket **private**: `avatars`, `room-issues`, `menus`, `donations`, `culture`, `tutor`. Dùng signed URL. Đường dẫn file `<school_id>/<user_id>/<uuid>.webp`, policy theo đường dẫn.

### 5.4 Logic phía database
- Trigger: khi `leave_requests` kind `go_home` được `approved` → tự tạo `meal_cancellations` cho các bữa trong khoảng thời gian, `source = leave_request`; nếu đơn bị hủy/từ chối → xóa mềm các suất đó.
- Trigger: tạo `notifications` cho phụ huynh khi con vắng điểm danh, có báo ốm, đơn được duyệt, có điểm mới.
- View `meal_counts` (date, meal, total_students, cancelled, to_cook).
- `pg_cron` hằng ngày: nhắc hạn nộp học bổng (7 ngày và 1 ngày trước) cho học sinh đã bookmark, nhắc lịch khám.

---

## 6. Đặc tả 8 chức năng

### 6.1 Ký túc xá số
- **Điểm danh bằng QR:** quản sinh mở phiên (sáng / tự học tối / kiểm tra phòng tối) → camera quét **thẻ QR cá nhân của học sinh** (in hoặc mở trên app). Sau mỗi lần quét hiện ảnh + tên + phòng 1.5 giây để quản sinh đối chiếu, rung nhẹ, tự quét tiếp. Có danh sách tích tay làm phương án dự phòng. **Chạy hoàn toàn offline** trên máy quản sinh. QR chứa `student_id` + chữ ký HMAC ngắn để chống QR giả.
- Kết thúc phiên → danh sách vắng, đánh dấu "có phép" nếu trùng đơn đã duyệt.
- **Xin phép online:** học sinh (hoặc phụ huynh) tạo đơn: loại, từ – đến, lý do. Quản sinh/GVCN duyệt trong 1 chạm. Học sinh thấy trạng thái theo dòng thời gian.
- **Báo hỏng đồ trong phòng:** chọn loại, mô tả, chụp ảnh (nén trước). Quản sinh đổi trạng thái.

### 6.2 Bếp ăn minh bạch
- Thực đơn cả tuần dạng 7 cột (cuộn ngang trên điện thoại), làm nổi hôm nay.
- **Báo cắt suất** theo ngày/bữa, hạn chót theo `meal_cancel_cutoff_hour` của trường; suất do đơn về nhà tạo ra hiển thị nhãn "Tự động – đơn về nhà".
- Nhà bếp xem **số suất cần nấu** từng bữa (to, rõ, in được).
- Nhà bếp đăng ảnh bữa ăn thực tế (minh bạch).
- **Góp món quê:** học sinh đề xuất món của dân tộc mình, các bạn bình chọn, nhà bếp đánh dấu "Sẽ nấu"/"Đã nấu".

### 6.3 ★ Sổ liên lạc Bản – Trường
- **Màn hình phụ huynh "Hôm nay của con":** điểm danh hôm nay, có báo ốm không, có đơn về nhà không, thông báo mới. Chữ lớn, tối đa 4 khối.
- Kết quả học tập: điểm theo môn/học kỳ, bảng đơn giản + thanh ngang CSS (không cần thư viện biểu đồ).
- Lịch về nhà của con (từ đơn đã duyệt).
- Thông báo từ trường, nút "Đã đọc" (giáo viên thấy ai đã đọc).
- Phụ huynh có nhiều con cùng trường → chuyển giữa các con ở đầu trang.
- **Giáo viên:** nhập điểm nhanh theo lớp dạng bảng (phím Tab/Enter đi ô tiếp), gửi thông báo theo trường/lớp/từng học sinh.

### 6.4 ★ Gia sư AI buổi tối
- Edge Function `ai-tutor` gọi Anthropic Messages API (model từ `AI_MODEL`), xác thực JWT, chỉ role `student`, giới hạn `AI_DAILY_LIMIT_PER_STUDENT` câu/ngày.
- Học sinh chọn môn + gõ câu hỏi hoặc **chụp ảnh đề bài**.
- **Phương pháp gợi mở:** AI không đưa đáp án ngay. Lần lượt: hỏi em đã hiểu đề chưa → gợi ý bước 1 → chờ em thử → gợi ý tiếp. Nút "Gợi ý tiếp" và "Xem lời giải đầy đủ" (chỉ mở sau ít nhất 2 lượt em tự thử).
- **Ôn theo bài trên lớp:** giáo viên đăng chủ đề tuần (`lesson_topics`) → AI tạo 5 câu luyện tập đúng chủ đề, chấm và giải thích.
- System prompt: tiếng Việt đơn giản, phù hợp học sinh THCS/THPT, ví dụ gần gũi với đời sống ở bản, chương trình GDPT 2018; chỉ hỗ trợ học tập. Nếu học sinh nói về chuyện buồn, bị bắt nạt, nguy hiểm → trả lời ân cần, khuyên nói với thầy cô/quản sinh, và client hiện nút gọi quản sinh.
- Offline: câu hỏi được xếp hàng, hiện "Câu hỏi sẽ được gửi khi có sóng". Lịch sử hội thoại xem được offline.
- Giáo viên chỉ thấy **thống kê chủ đề** học sinh hỏi nhiều (ẩn nội dung chi tiết), để biết lớp yếu phần nào.

### 6.5 Y tế học đường
- **Báo ốm:** chọn triệu chứng bằng chip có icon (sốt, đau đầu, đau bụng, ho, chóng mặt…), nhiệt độ (tùy chọn), ghi chú. Y tế nhận ngay qua Realtime.
- Theo dõi chiều cao/cân nặng theo đợt khám, nhắc lịch khám/tiêm.
- **Nút SOS:** luôn hiện ở màn hình chính học sinh, **giữ 2 giây** để kích hoạt (tránh bấm nhầm).
  - Có mạng: tạo `sos_alerts` → máy quản sinh & y tế hiện cảnh báo toàn màn hình + âm thanh qua Realtime, nút "Tôi đang đến".
  - **Mất mạng: hiện ngay 2 nút gọi điện thoại `tel:`** tới quản sinh và y tế (cuộc gọi vẫn chạy khi không có data), đồng thời xếp hàng cảnh báo để gửi khi có sóng.

### 6.6 Ngân hàng đồ cũ
- Đăng đồ cho: loại, lớp (với sách), size (với quần áo), tình trạng, ảnh.
- Đăng nhu cầu nhận: **riêng tư**, chỉ quản sinh thấy.
- **Gợi ý ghép cặp** (hàm thuần, có test): điểm = trùng loại (bắt buộc) + trùng lớp/size + ưu tiên áo ấm từ tháng 10 đến tháng 2 + ưu tiên nhu cầu tạo sớm. Quản sinh xem danh sách gợi ý, bấm "Ghép", rồi "Đã trao" khi giao nhận.
- Học sinh duyệt kho đồ đang có, bấm "Em cần cái này" (tạo nhu cầu gắn với món đó).

### 6.7 Học bổng & hướng nghiệp
- Danh sách học bổng, lọc: dành cho học sinh DTTS, theo lớp, còn hạn. Hiện số ngày còn lại. Lưu và nhận nhắc hạn.
- Bài viết chính sách cử tuyển, tuyển sinh (admin soạn bằng Markdown).
- **Trắc nghiệm nghề** theo mô hình Holland (RIASEC), 30 câu, nội dung trong `src/content/career-quiz.json`; kết quả 3 nhóm nổi bật + gợi ý ngành. Ghi rõ "Kết quả tham khảo, hãy trao đổi với thầy cô".

### 6.8 ★ Kho văn hóa Bản tôi
- Học sinh viết bài giới thiệu trang phục, lễ hội, món ăn, phong tục, lời chào, nghề thủ công của dân tộc mình (tối đa 4 ảnh).
- Giáo viên duyệt trước khi đăng.
- Trang kho: lọc theo dân tộc và chủ đề, dạng lưới ảnh 2 cột, trang chi tiết đọc dễ. Thanh chip "Trường mình có X dân tộc" lấy từ dữ liệu thật.
- Thích bài viết. Không có bình luận (tránh phải kiểm duyệt nhiều).

---

## 7. Offline-first & đồng bộ (phần quan trọng nhất)

- **UI luôn đọc từ Dexie** (`useLiveQuery`), không đọc trực tiếp Supabase.
- **Pull:** mỗi bảng có con trỏ `last_pulled_at`; lấy bản ghi `updated_at > con trỏ` (RLS tự lọc đúng phạm vi người dùng), ghi vào Dexie. Chạy khi mở app, khi sự kiện `online`, khi app quay lại foreground, và mỗi 60 giây khi đang có mạng.
- **Push:** mọi thao tác ghi đi vào bảng `outbox` trong Dexie `{id, table, op, payload, created_at, attempts, last_error}`; gửi tuần tự bằng `upsert` (idempotent nhờ UUID client), backoff tăng dần, tối đa 10 lần thì đánh dấu lỗi và cho người dùng "Thử lại".
- Xung đột: last-write-wins theo `updated_at` của server; riêng trạng thái duyệt (`status`) chỉ người có quyền mới đổi được nên ít xung đột.
- Ảnh offline: lưu Blob đã nén trong Dexie, upload khi có mạng rồi cập nhật `photo_path`.
- Service worker cache app shell + font + icon; ảnh đã xem cache theo chiến lược stale-while-revalidate, giới hạn 50MB.
- Đăng xuất → xóa sạch Dexie (máy có thể dùng chung).
- Viết module `src/sync/` tách biệt, **có test đầy đủ** (mất mạng giữa chừng, gửi trùng, token hết hạn).

---

## 8. Hiệu năng & chất lượng

- JS ban đầu **< 170KB gzip**; mỗi chức năng là một chunk lazy-load. Thêm `rollup-plugin-visualizer` để kiểm tra.
- Lighthouse mobile (giả lập máy yếu, 4G chậm): Performance ≥ 90, Accessibility ≥ 95, PWA cài được.
- Danh sách dài (> 50 dòng) phân trang hoặc tải dần, không render hết.
- Accessibility: label đầy đủ, focus rõ, không truyền tải thông tin chỉ bằng màu, hỗ trợ trình đọc màn hình cơ bản.
- Bảo mật: không có service role key ở client; mọi Edge Function kiểm tra JWT + role + zod; giới hạn kích thước upload (5MB); escape nội dung người dùng (không dùng `dangerouslySetInnerHTML`, render Markdown bằng thư viện có sanitize). Đây là **dữ liệu trẻ vị thành niên** — chỉ thu thập đúng thứ cần thiết.

---

## 9. Dữ liệu mẫu (seed)

`supabase/seed.sql` + script `npm run seed`:
- 1 trường: **"[TÊN TRƯỜNG]"** (để placeholder, tôi sẽ điền), có hotline quản sinh & y tế.
- 2 lớp (10A1, 11A2), 2 dãy nhà, 6 phòng.
- 14 học sinh với tên đúng phong cách các dân tộc: Mông (Giàng A Páo, Vàng Thị Dua), Dao (Triệu Văn Phú, Bàn Thị Mây), Tày (Hoàng Thị Lan, Nông Văn Toàn), Thái (Lò Thị Mai, Lường Văn Khánh), Mường (Bùi Thị Hoa), Nùng (Lăng Văn Sơn), Khơ Mú (Lò Văn Pắn), Hà Nhì (Lỳ Thị Xuân), Sán Dìu (Lam Văn Hùng), Giáy (Sùng Thị Nga).
- Tài khoản: `admin01`, `gv01`, `gv02`, `qs01`, `yt01`, `bep01`, `ph01` (có 2 con), `ph02`, `hs24001`…`hs24014`. Mật khẩu dev chung đọc từ biến `SEED_PASSWORD`, ghi trong README, bắt buộc đổi khi đăng nhập.
- Thực đơn 2 tuần với món ăn thật của bếp nội trú (cơm, canh rau cải, thịt kho, cá rán, đậu phụ sốt cà chua, xôi ngô…), 2 tuần điểm danh, vài đơn xin phép đủ trạng thái, điểm số học kỳ I, 3 học bổng mẫu, 6 món đồ cũ, 5 bài văn hóa (ghi chú "nội dung mẫu, cần học sinh thật viết lại").

---

## 10. Cấu trúc thư mục

```
src/
  app/            # router, providers, layout theo vai trò
  components/ui/  # Button, Card, Input, Chip, Sheet, Dialog, Tabs, EmptyState, SyncBadge, TribalStripe...
  features/
    dorm/ kitchen/ contact-book/ tutor/ health/ donations/ scholarships/ culture/ admin/ auth/
      (mỗi feature: pages/, components/, hooks/, api.ts, schema.ts, *.test.ts)
  sync/           # dexie db, pull, push, outbox, network status
  lib/            # supabase client, date, image, qr, format
  content/        # career-quiz.json, ...
  styles/         # tokens.css, fonts
supabase/
  migrations/ functions/ (admin-create-users, ai-tutor, attendance-verify) seed.sql
tests/e2e/
docs/ plans/ assumptions.md
```

---

## 11. Các giai đoạn (dừng lại sau MỖI giai đoạn để tôi duyệt)

| GĐ | Nội dung | Tiêu chí hoàn thành |
|---|---|---|
| **0** | Khởi tạo dự án, Tailwind + tokens, font, PWA, ESLint/Prettier, Vitest, Playwright, `CLAUDE.md`, trang `/dev/ui` đủ component + dải thổ cẩm | Tôi duyệt giao diện styleguide; build < budget |
| **1** | Migration toàn bộ schema + RLS + seed, đăng nhập/đổi mật khẩu/chọn vai trò, layout theo vai trò, module `sync/` | Test RLS xanh, đăng nhập offline được, chỉ báo đồng bộ chạy |
| **2** | Ký túc xá số + Bếp ăn minh bạch (gồm trigger đơn về nhà → cắt suất) | E2E: quét QR offline → bật mạng → dữ liệu lên server |
| **3** | Sổ liên lạc Bản – Trường + thông báo | E2E: GV nhập điểm → PH thấy điểm + thông báo |
| **4** | Y tế học đường + SOS | E2E: SOS offline hiện nút gọi; online → quản sinh nhận realtime |
| **5** | Gia sư AI buổi tối | Giới hạn lượt chạy đúng, không lộ API key, chế độ gợi mở hoạt động |
| **6** | Ngân hàng đồ cũ + Học bổng & hướng nghiệp | Test thuật toán ghép cặp; nhắc hạn chạy |
| **7** | Kho văn hóa Bản tôi + trang admin (import CSV, in thẻ QR) | Duyệt bài hoạt động; in thẻ đẹp trên A4 |
| **8** | Rà soát offline, hiệu năng, a11y, bảo mật (security-reviewer), README hướng dẫn deploy Supabase + Vercel | Lighthouse đạt chỉ tiêu, toàn bộ test xanh |

Mỗi giai đoạn bắt đầu bằng `/plan`, kết thúc bằng `/code-review` + verify. Báo cáo cuối giai đoạn gồm: đã làm gì, ảnh chụp màn hình chính (Playwright screenshot ở khổ 360px và 1280px), việc còn tồn đọng.

---

## 12. Ngoài phạm vi (không làm)
App native, thanh toán, nhắn tin 2 chiều giữa người dùng, bình luận, gửi SMS, đa ngôn ngữ (chỉ tiếng Việt ở bản này).
