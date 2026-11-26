# Kế hoạch Backend — FastAPI + Supabase + Gemini

Trạng thái: **ĐÃ DUYỆT** (2026-11-26) · Ngày lập: 2026-11-26
Thay cho phần backend trong PROMPT.md (Edge Functions + Anthropic). Frontend giữ nguyên hướng offline-first.

---

## 1. Kiến trúc tổng thể

```
┌──────────────── Điện thoại / máy tính ────────────────┐
│  frontend/ (Vite + React PWA)                         │
│   UI ⇄ Dexie (IndexedDB)  ⇄  outbox lệnh chờ gửi      │
└───────┬───────────────┬──────────────────┬────────────┘
        │ đăng nhập     │ REST /api/v1     │ Realtime (SOS, báo ốm)
        ▼               ▼                  ▼
  Supabase Auth    backend/ (FastAPI)   Supabase Realtime
        │           │   │      │              ▲
        │  xác thực JWT │      └── Gemini API (gia sư)
        │           ▼   ▼                     │
        └────────► Supabase Postgres (RLS) ───┘
                    Supabase Storage (ảnh, URL ký)
```

| Thành phần | Vai trò | Ghi chú |
|---|---|---|
| **Supabase Auth** | Đăng nhập mã + mật khẩu, cấp JWT | Client gọi thẳng (supabase-js); không tự viết auth |
| **FastAPI** | **Mọi đọc/ghi dữ liệu nghiệp vụ**: đồng bộ offline, duyệt đơn, chấm điểm, ghép đồ, AI, quản trị | Một API duy nhất, kiểm tra quyền + nghiệp vụ bằng Python, dễ test |
| **Postgres (Supabase)** | Lưu dữ liệu, ràng buộc, **RLS giữ làm lớp bảo vệ thứ hai** | FastAPI chạy truy vấn **dưới quyền người dùng** (xem §4) nên lỡ quên kiểm quyền trong code vẫn bị RLS chặn |
| **Supabase Storage** | Ảnh (phòng hỏng, bữa ăn, đồ cũ, văn hóa, đề bài) | FastAPI cấp *signed upload URL*; client tải thẳng lên, không đi qua server |
| **Supabase Realtime** | Đẩy SOS, báo ốm, đơn mới tới máy nhân viên ngay | Client đăng ký trực tiếp, RLS lọc đúng người nhận |
| **Gemini API** | Gia sư buổi tối: gợi mở từng bước, đọc ảnh đề, sinh và chấm câu luyện tập | Chỉ backend giữ API key |
| **Cron của nền tảng deploy** | Nhắc hạn học bổng, nhắc lịch khám, dọn dữ liệu | Chạy lệnh `python -m app.jobs ...`, không phụ thuộc server đang thức |

**Vì sao không cho client ghi thẳng vào Supabase?** Bạn chọn FastAPI để có backend riêng; đặt toàn bộ nghiệp vụ (hạn cắt suất, chỉ duyệt khi có quyền, ẩn người cho đồ, giới hạn lượt AI…) ở một chỗ bằng Python thì dễ đọc, dễ test hơn rải ra trigger SQL + RLS phức tạp.

---

## 2. Cấu trúc thư mục (backend tách hẳn khỏi frontend)

```
<gốc dự án>/
├─ frontend/                 # Vite + React (hiện là web/ hoặc thư mục gốc — xem §12)
├─ backend/
│  ├─ pyproject.toml         # uv quản lý môi trường + khóa phiên bản
│  ├─ uv.lock
│  ├─ Dockerfile
│  ├─ .env.example
│  ├─ app/
│  │  ├─ main.py             # tạo app, CORS, middleware, gắn router
│  │  ├─ core/
│  │  │  ├─ config.py        # pydantic-settings, đọc .env, kiểm tra đủ biến khi khởi động
│  │  │  ├─ security.py      # xác thực JWT Supabase (JWKS), lấy user + vai trò
│  │  │  ├─ db.py            # engine asyncpg, phiên "dưới quyền người dùng" + phiên service
│  │  │  ├─ errors.py        # lỗi nghiệp vụ → JSON tiếng Việt thống nhất
│  │  │  ├─ rate_limit.py
│  │  │  └─ timezone.py      # Asia/Ho_Chi_Minh cho hạn cắt suất, “hôm nay”
│  │  ├─ common/
│  │  │  ├─ deps.py          # CurrentUser, require_role(...), db session
│  │  │  ├─ schemas.py       # ApiResponse, Page, kiểu chung
│  │  │  └─ storage.py       # signed URL, kiểm tra đường dẫn <school>/<user>/<uuid>.webp
│  │  ├─ modules/            # mỗi chức năng một thư mục
│  │  │  ├─ auth/  admin/  sync/  notifications/
│  │  │  ├─ dorm/  kitchen/  contact_book/  tutor/
│  │  │  ├─ health/  donations/  scholarships/  culture/
│  │  │  │   (mỗi module: router.py · schemas.py · service.py · repository.py · commands.py)
│  │  ├─ ai/
│  │  │  ├─ gemini.py        # client bọc google-genai, timeout, retry, mock được
│  │  │  ├─ prompts/         # system prompt gia sư, prompt sinh câu luyện tập (tiếng Việt)
│  │  │  └─ safety.py        # nhận diện chuyện buồn/bắt nạt/nguy hiểm
│  │  └─ jobs/               # việc định kỳ: nhắc hạn, nhắc khám, dọn lượt AI
│  ├─ supabase/
│  │  ├─ config.toml
│  │  ├─ migrations/         # SQL schema + RLS + storage (Supabase CLI quản lý)
│  │  └─ seed.sql
│  ├─ scripts/seed.py        # đặt mật khẩu tài khoản mẫu từ SEED_PASSWORD
│  └─ tests/
│     ├─ unit/               # hàm thuần: ghép đồ, hạn cắt suất, chữ ký QR, RIASEC…
│     ├─ api/                # gọi endpoint bằng httpx + DB Supabase local
│     └─ rls/                # đăng nhập từng tài khoản mẫu, kiểm cả trường hợp BỊ CHẶN
└─ docs/
```

Schema vẫn viết bằng **SQL migration của Supabase CLI** (không dùng Alembic) để RLS, Storage policy, Realtime publication nằm cùng một chỗ.

---

## 3. Công nghệ backend

| Phần | Chọn | Lý do |
|---|---|---|
| Ngôn ngữ | Python 3.12 | |
| Web | **FastAPI** + Uvicorn | Theo yêu cầu; tự sinh tài liệu OpenAPI (`/docs`) |
| Kiểu dữ liệu | **Pydantic v2** | Validate mọi input, thông báo lỗi tiếng Việt |
| DB | **SQLAlchemy 2 (async) + asyncpg**, viết SQL rõ ràng (Core, không ORM nặng) | Cần `SET LOCAL role` theo từng giao dịch để RLS chạy |
| Xác thực | **PyJWT + JWKS** của Supabase | Kiểm chữ ký, hạn, `aud`, `iss` |
| Supabase Admin/Storage | `httpx` gọi Admin API + Storage API | Tạo tài khoản, đặt lại mật khẩu, ký URL |
| AI | **google-genai** (SDK chính thức của Gemini) | Hỗ trợ ảnh, `system_instruction`, trả JSON theo schema |
| Chữ ký QR | `cryptography` (**Ed25519**) | Xem §6.1 |
| Giới hạn tần suất | `slowapi` | Chặn dò mật khẩu, spam |
| Công cụ | **uv**, **ruff** (lint + format), **mypy --strict**, **pytest** + pytest-asyncio + httpx, coverage ≥ 80% | |
| Deploy | Docker → Render hoặc Railway (vùng **Singapore**, gần VN) | Có cron job sẵn |

Mô hình Gemini đặt bằng biến `GEMINI_MODEL` (mặc định bản Flash mới nhất lúc triển khai — rẻ, nhanh, đọc được ảnh); không ghi cứng trong code.

---

## 4. Xác thực, phân quyền, bảo mật

1. Client đăng nhập bằng supabase-js (mã `hs24001` → `hs24001@bannha.internal`), gửi `Authorization: Bearer <access_token>` tới FastAPI.
2. `security.py` xác thực JWT bằng JWKS (cache 10 phút), lấy `user_id`.
3. `deps.py` đọc `profiles` (vai trò, `school_id`, `must_change_password`) — **không tin vai trò trong JWT**.
4. Header `X-Active-Role` chọn vai trò đang dùng (người kiêm nhiệm); server kiểm vai trò đó có trong `profiles.roles`.
5. Mỗi request mở giao dịch:
   ```sql
   set local role authenticated;
   set local request.jwt.claims = '{"sub": "<user_id>", "role": "authenticated"}';
   ```
   → RLS của Postgres áp dụng như khi client gọi thẳng. Chỉ việc quản trị (tạo tài khoản), job định kỳ và ghi thông báo hệ thống dùng **phiên service** riêng, ghi rõ trong code.
6. `must_change_password = true` → mọi endpoint trả `403 MUST_CHANGE_PASSWORD` trừ `/auth/*`.

**Bảo mật bắt buộc:** CORS chỉ cho domain frontend; không trả service key/Gemini key ra ngoài; ảnh ≤ 5 MB, chỉ `image/webp|jpeg|png`; lỗi không lộ chi tiết SQL; log không chứa nội dung sức khỏe/tin nhắn gia sư; rate limit; dữ liệu trẻ vị thành niên chỉ lưu cái cần.

**Định dạng phản hồi chung:**
```json
{ "success": true, "data": {...}, "error": null, "meta": { "next_cursor": "..." } }
{ "success": false, "data": null, "error": { "code": "MEAL_CUTOFF_PASSED", "message": "Đã quá 15:00, không báo cắt suất bữa trưa mai được nữa." } }
```

---

## 5. Đồng bộ offline qua FastAPI (phần quan trọng nhất)

### 5.1 Kéo dữ liệu về — `GET /api/v1/sync/pull`
- Tham số: `cursors` = `{bảng: "<updated_at>|<id>"}`, `limit` (mặc định 500).
- Server trả các bản ghi `updated_at > cursor` của từng bảng **mà người dùng được xem** (RLS lọc), gồm cả bản ghi đã xóa mềm (`deleted_at`) để máy xóa theo.
- Con trỏ lùi 2 phút mỗi lần kéo để không sót bản ghi commit muộn; client ghi đè idempotent.
- Danh sách bảng kéo về phụ thuộc vai trò (học sinh không kéo `item_requests` của người khác…).

### 5.2 Gửi thao tác lên — `POST /api/v1/sync/push`
Outbox ở client lưu **lệnh nghiệp vụ**, không lưu dòng bảng thô:
```json
{ "ops": [
  { "op_id": "uuid", "command": "leave_request.create", "payload": {...}, "client_at": "..." },
  { "op_id": "uuid", "command": "attendance.record_qr", "payload": {"session_id": "...", "qr": "..."} }
]}
```
- Mỗi `command` có một handler Pydantic + service riêng (danh sách ở §6). Lệnh lạ → từ chối.
- **Idempotent:** bảng `sync_ops(op_id, user_id, result, created_at)` — gửi lại lệnh đã xử lý thì trả lại kết quả cũ.
- Kết quả từng lệnh: `applied` · `rejected` (lỗi nghiệp vụ, kèm mã + câu tiếng Việt, client hiện cho người dùng và **không thử lại**) · `retry` (lỗi tạm thời).
- Xung đột: last-write-wins theo thời điểm server ghi; riêng trạng thái duyệt chỉ người có quyền mới đổi.

### 5.3 Ảnh khi offline
Ảnh nén lưu trong Dexie → khi có mạng: `POST /api/v1/uploads` xin signed upload URL (server kiểm loại, dung lượng, đường dẫn) → client tải lên Storage → gửi lệnh gắn `photo_path`.

### 5.4 Thao tác chỉ chạy khi có mạng
Gia sư AI, quản trị tài khoản, import CSV — gọi endpoint trực tiếp; nếu offline thì xếp hàng (gia sư) hoặc báo "Cần có sóng".

---

## 6. Đặc tả từng chức năng

Ký hiệu vai trò: HS học sinh · PH phụ huynh · GV giáo viên · QS quản sinh · YT y tế · BEP nhà bếp · AD admin. Tất cả endpoint có tiền tố `/api/v1`.

### 6.0 Nền tảng: tài khoản, hồ sơ, thông báo

| Endpoint / lệnh | Ai | Việc |
|---|---|---|
| `GET /me` | mọi người | Hồ sơ, vai trò, trường, con (PH), lớp chủ nhiệm (GV), hotline |
| `POST /auth/password-changed` | mọi người | Gọi sau khi đổi mật khẩu bằng supabase-js; server kiểm mật khẩu đã đổi thật (so `auth.users.updated_at`) rồi tắt `must_change_password` |
| `GET /notifications`, lệnh `notification.mark_read` | mọi người | Thông báo trong app |
| `GET /announcements`, lệnh `announcement.mark_read` | theo đối tượng | Thông báo trường/lớp/cá nhân |
| `POST /announcements` | GV (lớp mình), AD/QS (toàn trường) | Gửi thông báo `all/students/parents/class/student` |
| `GET /announcements/{id}/reads` | người gửi | Ai đã đọc / chưa đọc |

Thông báo tự động (service gọi sau khi ghi, cùng giao dịch): con vắng điểm danh, có báo ốm, đơn được duyệt/từ chối, có điểm mới, đồ được ghép, bài văn hóa được duyệt.

### 6.1 Ký túc xá số

**Điểm danh QR — dùng chữ ký Ed25519 thay HMAC** (đề xuất thay PROMPT.md):
- Thẻ QR chứa `BN1.<student_id>.<key_version>.<chữ ký>`; server ký bằng **khóa bí mật**, máy quản sinh chỉ giữ **khóa công khai** để kiểm **hoàn toàn offline**. Mất máy quản sinh cũng không làm giả được thẻ (HMAC thì lộ khóa là làm giả được).
- Đổi khóa: tăng `key_version`, in lại thẻ.

| Endpoint / lệnh | Ai | Việc |
|---|---|---|
| `GET /dorm/qr-public-keys` | QS | Khóa công khai để kiểm thẻ offline |
| `GET /dorm/students/{id}/qr` | AD, QS, chính HS | Chuỗi QR đã ký (HS mở thẻ trên app) |
| lệnh `attendance.open_session` | QS | Mở phiên `morning / evening_study / night_check` theo dãy nhà |
| lệnh `attendance.record_qr` | QS | Server kiểm lại chữ ký, trùng thì bỏ qua, ghi `present` (hoặc `late` nếu quá giờ quy định) |
| lệnh `attendance.record_manual` | QS | Tích tay khi không quét được |
| lệnh `attendance.close_session` | QS | Ai chưa có mặt → `absent`; trùng đơn đã duyệt → `excused`; báo phụ huynh em vắng không phép |
| `GET /dorm/sessions/{id}/summary` | QS, GV | Có mặt / muộn / vắng / có phép |
| lệnh `leave_request.create` | HS (cho mình), PH (cho con) | Loại `go_home/sick/other`, từ – đến, lý do |
| lệnh `leave_request.cancel` | người tạo, khi còn `pending` | |
| lệnh `leave_request.review` | QS, GV chủ nhiệm | Duyệt / từ chối + ghi chú; duyệt đơn `go_home` → **tự tạo cắt suất** các bữa trong khoảng (§6.2); từ chối/hủy → xóa mềm các suất đó |
| lệnh `room_issue.create` | HS, QS | Loại, mô tả, ảnh |
| lệnh `room_issue.update_status` | QS | `open → in_progress → resolved` |

Nghiệp vụ có test: kiểm chữ ký QR (đúng/sai/khóa cũ/thẻ học sinh trường khác), đóng phiên đánh dấu vắng/có phép đúng, khoảng ngày đơn → danh sách bữa.

### 6.2 Bếp ăn minh bạch

| Endpoint / lệnh | Ai | Việc |
|---|---|---|
| `GET /kitchen/menus?week=` | mọi người | Thực đơn 7 ngày × 3 bữa |
| lệnh `menu.upsert` | BEP | Món, ghi chú, ảnh bữa ăn thật |
| lệnh `meal.cancel` / `meal.uncancel` | HS (mình), PH (con) | **Kiểm hạn**: trước `meal_cancel_cutoff_hour` của ngày hôm trước (giờ VN) |
| `GET /kitchen/meal-counts?date=` | BEP, QS, AD | Sĩ số – cắt suất – **cần nấu** từng bữa (view `meal_counts`) |
| lệnh `dish.suggest` | HS | Món quê: tên, dân tộc, mô tả |
| lệnh `dish.vote` / `dish.unvote` | HS | Mỗi em 1 phiếu / món |
| lệnh `dish.set_status` | BEP | `new → planned → served` |

Test: hạn cắt suất ở sát giờ (14:59 / 15:00 / qua nửa đêm), suất do đơn về nhà mang nhãn "Tự động – đơn về nhà", không trừ trùng 2 lần.

### 6.3 ★ Sổ liên lạc Bản – Trường

| Endpoint / lệnh | Ai | Việc |
|---|---|---|
| `GET /contact-book/children/{id}/today` | PH, GV, chính HS | Điểm danh hôm nay, báo ốm, đơn về nhà, thông báo mới (tối đa 4 khối) |
| `GET /contact-book/students/{id}/grades?term=` | PH, GV, HS | Điểm theo môn, điểm trung bình từng môn |
| `GET /contact-book/students/{id}/home-trips` | PH, HS | Lịch về nhà từ đơn đã duyệt |
| `GET /contact-book/classes/{id}/gradebook?subject=&term=` | GV | Bảng nhập điểm cả lớp |
| lệnh `grades.upsert_bulk` | GV lớp mình | Nhập nhanh nhiều điểm một lần; điểm 0–10, 2 chữ số thập phân; báo PH khi có điểm mới |

Test: tính điểm trung bình theo hệ số (miệng/15 phút ×1, 45 phút/giữa kỳ ×2, cuối kỳ ×3 — **giả định, cần bạn xác nhận**), GV không nhập được điểm lớp khác.

### 6.4 ★ Gia sư AI buổi tối (Gemini)

| Endpoint | Ai | Việc |
|---|---|---|
| `POST /tutor/sessions` | HS | Mở phiên: môn, (tùy chọn) chủ đề tuần |
| `POST /tutor/sessions/{id}/messages` | HS | `{ text?, image_path?, action: "ask" \| "hint" \| "solution" }` → câu trả lời |
| `GET /tutor/sessions`, `GET /tutor/sessions/{id}` | HS | Lịch sử (cũng được kéo về Dexie để xem offline) |
| `POST /tutor/practice` | HS | 5 câu luyện tập theo `lesson_topic` |
| `POST /tutor/practice/{id}/answers` | HS | Chấm + giải thích từng câu |
| `GET /tutor/usage/today` | HS | Còn bao nhiêu lượt hôm nay |
| lệnh `lesson_topic.upsert` | GV | Chủ đề tuần của lớp |
| `GET /tutor/classes/{id}/topic-stats` | GV | Chỉ **thống kê chủ đề** em hay hỏi, không xem nội dung |

**Cách hoạt động:**
1. Kiểm lượt: tăng `tutor_usage` nguyên tử (`insert … on conflict do update … where count < limit`), hết lượt → "Hôm nay em đã hỏi đủ 30 câu. Mai hỏi tiếp nhé."
2. Phương pháp gợi mở **do server cưỡng chế**, không chỉ nhờ prompt: đếm số lượt em tự thử trong phiên; `action=solution` khi chưa đủ 2 lượt → từ chối.
3. Gọi Gemini với `system_instruction` (tiếng Việt đơn giản, chương trình GDPT 2018, ví dụ đời sống ở bản, chỉ hỗ trợ học tập, không đưa đáp án ngay), 10 tin gần nhất, ảnh đề (đọc từ Storage, gửi dạng bytes).
4. Yêu cầu Gemini trả **JSON theo schema**: `{ reply, step, topic_tag, distress }`.
5. `distress = true` (buồn, bị bắt nạt, nguy hiểm) → trả lời ân cần, khuyên nói với thầy cô; client hiện nút gọi quản sinh. Có thêm bộ lọc từ khóa ở `safety.py` làm lớp dự phòng.
6. **Không gửi tên, lớp, dân tộc của em lên Gemini.** Không log nội dung hội thoại.
7. Gemini lỗi/quá tải → thử lại 1 lần, rồi báo "Gia sư đang bận, em thử lại sau ít phút" và **không trừ lượt**.

Test (Gemini được mock): hết lượt, chặn xem lời giải sớm, câu buồn bật cờ, lỗi Gemini không trừ lượt, JSON sai schema được xử lý.

### 6.5 Y tế học đường

| Endpoint / lệnh | Ai | Việc |
|---|---|---|
| lệnh `health_report.create` | HS | Triệu chứng (danh sách cố định), nhiệt độ 34–43 °C (tùy chọn), ghi chú → Realtime tới YT, báo PH |
| lệnh `health_report.update` | YT | `new → seen → handled` + ghi chú xử lý |
| lệnh `health_check.record` | YT | Chiều cao, cân nặng theo đợt khám |
| `GET /health/students/{id}/growth` | YT, PH, HS, GV CN | Lịch sử chiều cao/cân nặng |
| lệnh `medical_reminder.create` / `.done` | YT | Nhắc khám/tiêm |
| lệnh `sos.raise` | HS | Ghi `sos_alerts` → Realtime toàn màn hình tới QS & YT |
| lệnh `sos.acknowledge` | QS, YT | "Tôi đang đến" — chỉ người đầu tiên được ghi nhận, người khác thấy ai đang đến |
| `GET /health/sos/open` | QS, YT | SOS chưa xử lý |

SOS **khi mất mạng** do frontend xử lý (hiện nút gọi `tel:` tới hotline lấy từ `/me`, xếp lệnh `sos.raise` chờ gửi). Server ghi nhận `client_at` để biết em bấm lúc nào.

Quyền xem dữ liệu sức khỏe: chính HS, PH của em, YT, QS, GV chủ nhiệm — **test cả trường hợp bị chặn** (GV lớp khác, HS khác, bếp).

### 6.6 Ngân hàng đồ cũ

| Endpoint / lệnh | Ai | Việc |
|---|---|---|
| lệnh `donation.create` | HS, GV, QS | Loại, lớp (sách), size (quần áo), tình trạng, ảnh |
| `GET /donations?category=&grade=&size=` | HS | Đồ đang `available`, **không có thông tin người cho** |
| lệnh `item_request.create` | HS | Nhu cầu riêng tư — **chỉ em và QS thấy**; có thể gắn món cụ thể ("Em cần cái này") |
| lệnh `item_request.cancel` | HS | |
| `GET /donations/match-suggestions` | QS | Danh sách gợi ý ghép, xếp theo điểm |
| lệnh `match.propose` / `match.hand_over` | QS | "Ghép" → món chuyển `reserved`; "Đã trao" → `given`, nhu cầu `fulfilled`, báo em |

**Thuật toán ghép (hàm thuần, test kỹ):**
```
nếu khác loại → loại bỏ
điểm = 50
     + 25 nếu trùng lớp (sách) / trùng size (quần áo)
     + 15 nếu là áo ấm và tháng ∈ {10, 11, 12, 1, 2}
     + tối đa 10 theo thời gian chờ của nhu cầu (sớm hơn → cao hơn)
     + 10 nếu nhu cầu gắn đúng món này
tình trạng: like_new > good > used (dùng để xếp khi bằng điểm)
mỗi món chỉ đề xuất cho 1 nhu cầu đang mở có điểm cao nhất
```

### 6.7 Học bổng & hướng nghiệp

| Endpoint / lệnh | Ai | Việc |
|---|---|---|
| `GET /scholarships?ethnic_minority=&grade=&open_only=` | mọi người | Kèm **số ngày còn lại** |
| `POST/PATCH/DELETE /scholarships` | AD | Quản lý học bổng |
| lệnh `scholarship.bookmark` / `.unbookmark` | HS | Lưu + nhận nhắc hạn |
| `GET /articles?category=`, `GET /articles/{id}` | mọi người | Chính sách cử tuyển, tuyển sinh (Markdown) |
| `POST/PATCH /articles` | AD | Soạn bài |
| `GET /career/quiz` | HS | 30 câu RIASEC |
| `POST /career/results` | HS | Server chấm → 3 nhóm nổi bật + gợi ý ngành, ghi chú "Kết quả tham khảo, hãy trao đổi với thầy cô" |

Job hằng ngày 7:00: nhắc hạn học bổng còn 7 ngày và 1 ngày cho em đã lưu; không nhắc trùng (bảng `reminder_log`).

### 6.8 ★ Kho văn hóa Bản tôi

| Endpoint / lệnh | Ai | Việc |
|---|---|---|
| lệnh `culture_post.create` / `.update` | HS | Chủ đề (trang phục, lễ hội, món ăn, phong tục, lời chào, nghề), tối đa 4 ảnh, trạng thái `pending` |
| `GET /culture/posts?ethnicity=&category=` | mọi người | Chỉ bài `published` (+ bài của chính mình) |
| `GET /culture/review-queue` | GV | Bài chờ duyệt |
| lệnh `culture_post.review` | GV | Đăng / trả lại kèm góp ý; báo em |
| lệnh `culture_post.like` / `.unlike` | mọi người | Không có bình luận |
| `GET /culture/ethnicities` | mọi người | "Trường mình có X dân tộc" — đếm từ dữ liệu thật |

### 6.9 Quản trị trường

| Endpoint | Ai | Việc |
|---|---|---|
| `POST /admin/users` | AD | Tạo 1 tài khoản (Supabase Admin API, `email_confirm: true`), bắt đổi mật khẩu |
| `POST /admin/users/import` | AD | **Import CSV** (UTF-8): kiểm tra từng dòng, trả báo cáo dòng lỗi; chạy thử (`dry_run`) trước khi tạo thật |
| `POST /admin/users/{id}/reset-password` | AD | Mật khẩu tạm + bắt đổi |
| `PATCH /admin/users/{id}` | AD | Vai trò, lớp, phòng, khóa/mở tài khoản |
| `CRUD /admin/classes`, `/admin/rooms`, `/admin/guardian-links` | AD | Lớp, phòng, liên kết phụ huynh – con |
| `GET /admin/qr-cards?class_id=` | AD | Dữ liệu in thẻ (tên, lớp, phòng, ảnh, chuỗi QR đã ký) — trang in A4 8 thẻ do frontend dựng |
| `PATCH /admin/school` | AD | Hotline, giờ chốt cắt suất |

Admin chỉ thao tác trong trường của mình; không tự xóa vai trò admin cuối cùng.

---

## 7. Cơ sở dữ liệu

Giữ nguyên các bảng PROMPT.md §5.1, thêm:

| Bảng | Để làm gì |
|---|---|
| `sync_ops` | Chống xử lý lệnh trùng (idempotent) |
| `qr_signing_keys` | Khóa công khai + phiên bản (khóa bí mật để ở biến môi trường/secret, **không** trong DB) |
| `tutor_practice_sets` | 5 câu luyện tập + đáp án + kết quả chấm |
| `reminder_log` | Không gửi nhắc trùng |
| `audit_log` | Ai duyệt đơn, sửa điểm, đặt lại mật khẩu, lúc nào |

Quy ước mọi bảng: `id uuid` (client sinh với dữ liệu tạo offline), `school_id`, `created_at`, `updated_at` (trigger), `deleted_at`; index `(school_id, updated_at, id)`. **RLS bật cho mọi bảng**; Realtime publication chỉ gồm `sos_alerts`, `health_reports`, `leave_requests`, `notifications`.

---

## 8. Biến môi trường (`backend/.env.example`)

```
APP_ENV=development
CORS_ORIGINS=http://localhost:5173
SUPABASE_URL=
SUPABASE_JWKS_URL=                 # mặc định <SUPABASE_URL>/auth/v1/.well-known/jwks.json
SUPABASE_SERVICE_ROLE_KEY=         # chỉ backend
DATABASE_URL=                      # postgresql+asyncpg://... (pooler của Supabase)
ACCOUNT_EMAIL_DOMAIN=bannha.internal
GEMINI_API_KEY=                    # chỉ backend
GEMINI_MODEL=                      # vd. bản Flash mới nhất
AI_DAILY_LIMIT_PER_STUDENT=30
QR_SIGNING_PRIVATE_KEY=            # Ed25519, base64
QR_KEY_VERSION=1
MAX_UPLOAD_MB=5
TIMEZONE=Asia/Ho_Chi_Minh
JOBS_SECRET=                       # nếu cron gọi qua HTTP
SEED_PASSWORD=                     # chỉ dùng ở máy dev
```

---

## 9. Kiểm thử & chất lượng

| Loại | Công cụ | Phạm vi |
|---|---|---|
| Unit | pytest | Ghép đồ, hạn cắt suất, khoảng ngày → bữa, chữ ký QR, RIASEC, điểm trung bình, prompt builder |
| API | pytest + httpx + Supabase local (Docker) | Mỗi endpoint/lệnh: thành công, sai dữ liệu, **sai quyền** |
| RLS | pytest, đăng nhập từng tài khoản seed | Ma trận quyền, đặc biệt sức khỏe, nhu cầu nhận đồ, người cho đồ |
| Sync | pytest | Lệnh trùng, lệnh lạ, lỗi giữa chừng, con trỏ không sót bản ghi |
| AI | Gemini mock | Không gọi API thật trong CI |
| E2E | Playwright (frontend) | Các luồng ở §10 |

Lệnh: `uv run ruff check`, `uv run mypy app`, `uv run pytest --cov` (≥ 80%). Review: agent **security-reviewer** cho auth, upload, admin, AI; **architect** cho migration/RLS.

---

## 10. Lộ trình

| GĐ | Backend | Frontend nối vào | Tiêu chí xong |
|---|---|---|---|
| **B0** | Khung `backend/`: uv, FastAPI, config, JWT, phiên RLS, lỗi chuẩn, `/health`, Dockerfile, CI lint/type/test; `supabase init` + chạy local | Biến `VITE_API_URL` | `/docs` chạy, test xác thực xanh |
| **B1** | Toàn bộ migration + RLS + seed; `/me`, đổi mật khẩu; `sync/pull`, `sync/push`, `uploads`; thông báo | Đăng nhập, chọn vai trò, Dexie + outbox, chỉ báo đồng bộ | Test RLS xanh; đăng nhập offline; push trùng không nhân đôi |
| **B2** | Ký túc xá số + Bếp ăn | Màn điểm danh QR, đơn, sự cố phòng, thực đơn, cắt suất | E2E: quét QR offline → bật mạng → dữ liệu lên server; đơn về nhà duyệt → tự cắt suất |
| **B3** | Sổ liên lạc + thông báo | Màn PH "Hôm nay của con", bảng điểm GV | E2E: GV nhập điểm → PH thấy điểm + thông báo |
| **B4** | Y tế + SOS + Realtime | Báo ốm, SOS | E2E: SOS offline hiện nút gọi; online → QS nhận realtime |
| **B5** | Gia sư AI (Gemini) | Màn gia sư | Giới hạn lượt đúng, không lộ key, gợi mở được cưỡng chế |
| **B6** | Đồ cũ + Học bổng + hướng nghiệp + job nhắc hạn | Các màn tương ứng | Test thuật toán ghép; nhắc hạn chạy đúng 1 lần |
| **B7** | Văn hóa + quản trị (CSV, in thẻ QR) | Các màn tương ứng | Duyệt bài chạy; import 200 dòng có dòng lỗi được báo rõ |
| **B8** | Rà soát bảo mật, hiệu năng, deploy (Supabase project + Render/Railway + Vercel), README | | Toàn bộ test xanh, deploy chạy thật |

Mỗi giai đoạn: lập kế hoạch chi tiết → bạn duyệt → TDD → review → verify → commit → **dừng chờ duyệt**.

---

## 11. Rủi ro & lưu ý

| Mức | Rủi ro | Xử lý |
|---|---|---|
| **Cao** | **Gemini bản miễn phí được Google dùng dữ liệu để cải thiện mô hình** — đây là dữ liệu trẻ vị thành niên | Bắt buộc dùng **gói trả phí** (hoặc Vertex AI); không gửi thông tin nhận dạng; ghi rõ trong README |
| Cao | RLS/kiểm quyền sai làm lộ dữ liệu học sinh | Kiểm quyền 2 lớp (Python + RLS), test cả chiều bị chặn |
| TB | Server ngủ (gói free Render/Railway) → lần gọi đầu chậm 30–60 s | App offline-first nên vẫn dùng được; khuyến nghị gói trả phí nhỏ nhất khi chạy thật |
| TB | Kết nối DB cạn khi nhiều người | Dùng Supabase pooler (transaction mode), pool nhỏ, giao dịch ngắn |
| TB | Supabase CLI + Docker lỗi với đường dẫn có dấu `D:\bản nhà` | Kiểm ngay ở B0; đề xuất thư mục không dấu |
| Thấp | Gemini đổi tên mô hình | `GEMINI_MODEL` cấu hình được |

Thay đổi so với PROMPT.md cần cập nhật sau khi duyệt: bỏ Edge Functions → FastAPI; Anthropic → Gemini; HMAC → Ed25519; client không ghi thẳng Supabase. CLAUDE.md sẽ sửa tương ứng.

---

## 12. Quyết định đã chốt (2026-11-26)

1. Thư mục: `D:an-nha` (đường dẫn không dấu), `frontend/` và `backend/` ngang hàng; Supabase nằm trong `backend/supabase/`.
2. Mọi đọc/ghi nghiệp vụ đi qua FastAPI — **đồng ý**.
3. Gemini **gói miễn phí** — chủ dự án chấp nhận rủi ro; bù lại: không gửi thông tin nhận dạng, không gửi ảnh có mặt người, có thông báo cho người dùng trong màn gia sư, dễ chuyển sang gói trả phí bằng cách đổi key.
4. Backend chạy trên **Render** (Singapore).
5. Thẻ QR dùng **Ed25519**.
6. Hệ số điểm trung bình **đúng** như §6.3.
