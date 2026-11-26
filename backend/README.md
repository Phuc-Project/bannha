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
uv run uvicorn --factory app.main:app_factory --reload --port 8000
```

Mở http://localhost:8000/docs để xem và thử API.

## Kiểm tra

```bash
uv run ruff format --check . && uv run ruff check .
uv run mypy
uv run pytest --cov             # test không cần DB; test DB tự bỏ qua nếu chưa có TEST_DATABASE_URL
TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres uv run pytest -m db
```

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
