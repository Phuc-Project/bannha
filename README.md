# BẢN NHÀ — Ứng dụng hỗ trợ học sinh dân tộc nội trú

> *"Xa bản, vẫn có nhà. Một ứng dụng – mọi việc của đời sống nội trú."*

Ứng dụng PWA Offline-First dành cho trường Phổ thông Dân tộc Nội trú (PTDTNT) vùng cao, tối ưu cho điện thoại Android cấu hình thấp (Android 8+, RAM 2GB, màn hình 360px) và điều kiện sóng yếu hoặc mất mạng.

## Cấu trúc thư mục

```text
ban-nha/
├── frontend/   ← Frontend (Vite + React 18 + TypeScript strict + Tailwind PWA)
├── backend/    ← API FastAPI (Python) + supabase/ (migrations, RLS, seed) — xem backend/README.md
├── e2e/        ← Kiểm thử Playwright E2E (khổ 360×800 và 1280×800)
├── scripts/    ← Công cụ sinh icon PWA, kiểm tra ngân sách bundle, seed & sinh type
└── docs/       ← Kế hoạch giai đoạn (plans/), quyết định kỹ thuật (assumptions.md), screenshots
```

## Lệnh phát triển

```bash
npm install          # Cài đặt dependencies cho toàn bộ workspace
npm run dev          # Chạy Vite dev server (Styleguide tại http://localhost:5173/dev/ui)
npm run test         # Chạy kiểm thử đơn vị & component (Vitest)
npm run build        # Build bản sản phẩm PWA vào frontend/dist/
npm run check:budget # Kiểm tra tổng JS khởi tạo < 170KB gzip
npm run test:e2e     # Chạy kiểm thử E2E Playwright (360px & 1280px)
npm run verify       # Cổng kiểm định đầy đủ: lint + typecheck + test + build + check:budget
```

### Backend

```bash
cd backend
uv sync && cp .env.example .env
npx supabase start                                   # cần Docker Desktop đang chạy
uv run uvicorn --factory app.main:app_factory --reload --port 8000   # http://localhost:8000/docs
uv run pytest --cov && uv run ruff check . && uv run mypy
```
