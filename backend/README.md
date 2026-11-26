# BẢN NHÀ — Backend (FastAPI)

API cho ứng dụng BẢN NHÀ (trường phổ thông dân tộc nội trú). Kế hoạch chi tiết: [../docs/plans/backend-fastapi.md](../docs/plans/backend-fastapi.md).

- **FastAPI** xử lý mọi đọc/ghi nghiệp vụ, chạy truy vấn dưới quyền người dùng (`SET LOCAL ROLE authenticated`) để RLS của Postgres luôn là lớp bảo vệ thứ hai.
- **Supabase**: Auth (đăng nhập), Postgres, Storage riêng tư, Realtime (`sos_alerts`, `health_reports`, `leave_requests`, `notifications`). Schema nằm ở `supabase/migrations/`.
- **Gemini** cho gia sư buổi tối gợi mở từng bước (không gửi thông tin cá nhân học sinh, không ghi log hội thoại).
- **Ed25519** cho thẻ điểm danh QR kiểm tra offline.

## Chạy trên máy

Cần [uv](https://docs.astral.sh/uv/), Node (để chạy Supabase CLI) và Docker Desktop.

```bash
cd backend
uv sync                                                      # tạo .venv, cài thư viện
cp .env.example .env                                         # điền SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY...
uv run python -m scripts.gen_qr_key                          # sinh cặp khóa Ed25519 ký thẻ QR
npx supabase start                                           # chạy Supabase local
npx supabase db reset                                        # tạo lại schema + dữ liệu mẫu
SEED_PASSWORD='MatKhau2026' uv run python -m scripts.seed    # đặt mật khẩu chung cho tài khoản mẫu
uv run uvicorn --factory app.main:app_factory --reload --port 8000
```

Mở http://localhost:8000/docs để xem và thử API.

## Kiểm tra chất lượng

```bash
uv run ruff format --check . && uv run ruff check .
uv run mypy
uv run pytest --cov=app         # chạy toàn bộ unit + API test (không cần Docker; test DB tự bỏ qua)
# Đủ bộ (RLS + API thật), cần Supabase local đã reset + seed:
TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres SEED_PASSWORD='MatKhau2026' uv run pytest --cov=app
```

## Tiện ích dòng lệnh (`scripts/` & `app/jobs/`)

- `uv run python -m scripts.seed` — đặt mật khẩu tài khoản mẫu trên Supabase local.
- `uv run python -m scripts.gen_qr_key` — sinh cặp khóa Ed25519 (`QR_SIGNING_PRIVATE_KEY` + khóa công khai lưu vào `app.qr_signing_keys`).
- `uv run python -m app.jobs.reminders` — gửi nhắc hạn học bổng (còn 7 ngày / 1 ngày) và lịch y tế đến hạn (chống gửi trùng bằng `app.reminder_log`).

## Tài khoản mẫu

`admin01`, `gv01` (giáo viên kiêm quản sinh, chủ nhiệm 10A1), `gv02` (chủ nhiệm 11A2), `qs01`, `yt01`, `bep01`,
`ph01` (2 con: Lò Thị Mai, Lò Văn Pắn), `ph02` (con: Giàng A Páo), `hs24001`…`hs24014`.

## Danh mục REST API (`/api/v1`)

| Nhóm | Endpoint | Việc |
|---|---|---|
| Hệ thống | `GET /health`, `GET /health/ready`, `GET /api/v1/session` | Kiểm tra sống, kết nối DB, phiên JWT |
| Hồ sơ & Auth | `GET /api/v1/me`, `POST /api/v1/auth/change-password` | Hồ sơ, trường, con/lớp chủ nhiệm, đổi mật khẩu |
| Đồng bộ & Ảnh | `POST /api/v1/sync/pull`, `POST /api/v1/sync/push`, `GET /api/v1/sync/tables`, `POST /api/v1/uploads` | Đồng bộ offline con trỏ + outbox lệnh idempotent, xin URL tải ảnh |
| Ký túc xá | `GET /api/v1/dorm/qr-public-keys`, `GET /api/v1/dorm/students/{id}/qr`, `GET /api/v1/dorm/sessions/{id}/summary` | Khóa công khai Ed25519, thẻ QR học sinh, tổng hợp phiên điểm danh |
| Bếp ăn | `GET /api/v1/kitchen/meal-counts` | Sĩ số nội trú – báo cắt – suất cần nấu theo bữa |
| Sổ liên lạc | `GET /api/v1/contact-book/students/{id}/grades`, `GET /api/v1/announcements/{id}/reads` | Bảng điểm kèm trung bình hệ số (1/2/3), danh sách đã đọc thông báo |
| Gia sư AI | `GET /api/v1/tutor/usage/today`, `POST /api/v1/tutor/sessions`, `POST /api/v1/tutor/sessions/{id}/messages`, `POST /api/v1/tutor/practice`, `POST /api/v1/tutor/practice/{id}/answers`, `GET /api/v1/tutor/classes/{id}/topic-stats` | Hỏi đáp gợi mở (khóa lời giải < 2 lượt thử), bộ 5 câu luyện tập, thống kê chủ đề lớp |
| Đồ cũ | `GET /api/v1/donations/match-suggestions` | Gợi ý ghép 1-1 đồ tặng và nhu cầu theo điểm ưu tiên |
| Học bổng & Hướng nghiệp | `POST/PATCH/DELETE /api/v1/scholarships`, `POST/PATCH /api/v1/articles`, `POST /api/v1/career/results` | Quản trị học bổng/bài viết cử tuyển, chấm trắc nghiệm RIASEC |
| Văn hóa | `GET /api/v1/culture/ethnicities` | Thống kê các dân tộc trong trường |
| Quản trị | `POST /api/v1/admin/users`, `POST /api/v1/admin/users/import`, `POST /api/v1/admin/users/{id}/reset-password`, `PATCH /api/v1/admin/users/{id}`, `POST /api/v1/admin/classes`, `POST /api/v1/admin/rooms`, `POST /api/v1/admin/guardian-links`, `GET /api/v1/admin/qr-cards`, `PATCH /api/v1/admin/school` | Tạo/nhập CSV tài khoản, đặt lại mật khẩu, chặn xóa admin cuối, lớp/phòng/phụ huynh, dữ liệu in thẻ QR A4, cấu hình trường |
| Định kỳ | `POST /api/v1/jobs/reminders` | Chạy nhắc hạn qua HTTP (`X-Jobs-Secret`) |

## Lệnh đồng bộ (`POST /api/v1/sync/push`)

- **Chung**: `notification.mark_read`, `announcement.mark_read`, `announcement.create`, `profile.update_contact`
- **Ký túc xá**: `attendance.open_session`, `attendance.record_qr`, `attendance.record_manual`, `attendance.close_session`, `leave_request.create`, `leave_request.cancel`, `leave_request.review`, `room_issue.create`, `room_issue.update_status`
- **Bếp ăn**: `menu.upsert`, `meal.cancel`, `meal.uncancel`, `dish.suggest`, `dish.vote`, `dish.unvote`, `dish.set_status`
- **Sổ liên lạc**: `grades.upsert_bulk`, `lesson_topic.upsert`
- **Y tế & SOS**: `health_report.create`, `health_report.update`, `health_check.record`, `medical_reminder.create`, `medical_reminder.done`, `sos.raise`, `sos.acknowledge`
- **Đồ cũ**: `donation.create`, `item_request.create`, `item_request.cancel`, `match.propose`, `match.hand_over`
- **Học bổng**: `scholarship.bookmark`, `scholarship.unbookmark`
- **Văn hóa**: `culture_post.create`, `culture_post.review`, `culture_post.like`, `culture_post.unlike`

## Lưu ý bảo mật dữ liệu học sinh

> **Quan trọng (Gemini API)**: Không bao giờ gửi họ tên, mã học sinh, lớp, phòng ở hay dân tộc lên Gemini; server cũng không ghi log nội dung tin nhắn gia sư hay sức khỏe. Khi triển khai thực tế cho học sinh vị thành niên, nhà trường nên dùng **gói trả phí Gemini API / Vertex AI** để Google không dùng dữ liệu cải thiện mô hình.

## Deploy (Render)

`render.yaml` ở gốc repo khai báo dịch vụ Docker `ban-nha-api` (vùng Singapore, health check `/health`). Trên Render dùng chuỗi kết nối **Session pooler** của Supabase cho `DATABASE_URL` (đổi tiền tố thành `postgresql+asyncpg://`).
