# Supabase (thuộc backend)

- `config.jsonc` — cấu hình stack local (`npx supabase start`, chạy trong thư mục `backend/`).
- `migrations/` — schema Postgres, hàm `private.*`, RLS cho mọi bảng, Storage, Realtime (từ giai đoạn B1).
- `seed.sql` — dữ liệu mẫu (B1); mật khẩu tài khoản mẫu đặt bằng `scripts/seed.py` từ biến `SEED_PASSWORD`.

Logic nghiệp vụ nằm ở FastAPI (`../app/`), không dùng Edge Functions.
