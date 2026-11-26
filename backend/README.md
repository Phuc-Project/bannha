# BẢN NHÀ — Backend (FastAPI)

API cho ứng dụng BẢN NHÀ. Kế hoạch đầy đủ: [../docs/plans/backend-fastapi.md](../docs/plans/backend-fastapi.md).

- **FastAPI** xử lý mọi đọc/ghi nghiệp vụ, chạy truy vấn dưới quyền người dùng để RLS của Postgres vẫn áp dụng.
- **Supabase**: Auth (đăng nhập), Postgres, Storage, Realtime. Schema nằm ở `supabase/migrations/`.
- **Gemini** cho gia sư buổi tối (từ giai đoạn B5).

## Chạy trên máy

Cần [uv](https://docs.astral.sh/uv/), Node (để chạy Supabase CLI) và Docker Desktop.

```bash
cd backend
uv sync                         # tạo .venv, cài thư viện
cp .env.example .env            # điền SUPABASE_SERVICE_ROLE_KEY từ lệnh dưới
npx supabase start              # chạy Supabase local (lần đầu tải image khá lâu)
npx supabase db reset           # tạo lại schema + dữ liệu mẫu
SEED_PASSWORD='MatKhau2026' uv run python -m scripts.seed   # đặt mật khẩu chung cho tài khoản mẫu
uv run uvicorn --factory app.main:app_factory --reload --port 8000
```

Mở http://localhost:8000/docs để xem và thử API.

## Kiểm tra

```bash
uv run ruff format --check . && uv run ruff check .
uv run mypy
uv run pytest                   # test không cần DB (test DB tự bỏ qua)
# Đủ bộ (RLS + API thật), cần Supabase local đã reset + seed:
TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres SEED_PASSWORD='MatKhau2026' uv run pytest --cov
```

## Tài khoản mẫu

`admin01`, `gv01` (giáo viên kiêm quản sinh, chủ nhiệm 10A1), `gv02` (chủ nhiệm 11A2), `qs01`, `yt01`, `bep01`,
`ph01` (2 con: Lò Thị Mai, Lò Văn Pắn), `ph02` (con: Giàng A Páo), `hs24001`…`hs24014`.
Mật khẩu là `SEED_PASSWORD` bạn đặt; lần đầu đăng nhập bắt buộc đổi mật khẩu.

## API hiện có (B1)

| Endpoint | Việc |
|---|---|
| `GET /health`, `GET /health/ready` | Kiểm tra sống / kết nối DB |
| `GET /api/v1/me` | Hồ sơ, vai trò, trường, con (phụ huynh), lớp chủ nhiệm |
| `POST /api/v1/auth/change-password` | Đổi mật khẩu (bắt buộc lần đầu) |
| `POST /api/v1/sync/pull` | Kéo dữ liệu thay đổi theo con trỏ, RLS lọc đúng phạm vi |
| `POST /api/v1/sync/push` | Gửi lệnh offline, idempotent theo `op_id` |
| `GET /api/v1/sync/tables` | Danh sách bảng đồng bộ được |
| `POST /api/v1/uploads` | Xin URL ký để tải 1 ảnh lên Storage riêng tư |

## Cấu trúc

```
app/
  main.py            # create_app(): CORS, lỗi chuẩn, router
  core/              # config, security (JWT Supabase), db (phiên RLS), errors
  common/            # deps dùng chung, khuôn phản hồi { success, data, error, meta }
  modules/<chức năng>/  router · schemas · service · repository
supabase/            # config.jsonc, migrations/, seed.sql
tests/ unit/ api/ db/
```

## Deploy (Render)

`render.yaml` ở gốc repo khai báo dịch vụ Docker `ban-nha-api` (vùng Singapore, health check `/health`). Các biến bí mật nhập trên dashboard Render. Trên Render dùng chuỗi kết nối **Session pooler** của Supabase cho `DATABASE_URL` (đổi tiền tố thành `postgresql+asyncpg://`).
