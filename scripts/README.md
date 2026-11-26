# Tiện ích Dự án (`scripts/`)

- `gen-icons.mjs`: Sinh bộ icon PWA (`192×192`, `512×512`) và `favicon.svg` vào `frontend/public/`.
- `check-budget.mjs`: Đo tổng dung lượng JS khởi tạo sau nén gzip của `frontend/dist/`, đảm bảo `< 170KB`.
- *(Giai đoạn 1)* `seed.mjs`: Khởi tạo tài khoản mẫu và dữ liệu trường PTDTNT từ biến `SEED_PASSWORD`.
- *(Giai đoạn 1)* `gen-types.mjs`: Sinh kiểu dữ liệu TypeScript từ schema Supabase vào `frontend/src/lib/database.types.ts`.
