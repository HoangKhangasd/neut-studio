# Kiến Trúc Dự Án Neut-Studio (pnpm Monorepo)

## 1. Cấu trúc Monorepo
- `apps/api`: NestJS 11 + Drizzle ORM + MinIO S3 + PostgreSQL 16
- `apps/web`: Next.js 15 App Router + Tailwind CSS + Zustand + TanStack Query
- `packages/types`: Khai báo Type definitions TypeScript dùng chung
- `infra/`: Docker Compose (PostgreSQL 16, MinIO, Redis 7.2)
- `docs/`: Tài liệu kỹ thuật, kiến trúc, phân rã chức năng
- `scripts/`: Script tự động hóa vận hành

## 2. Thông tin Cổng Dịch Vụ
- **Web Storefront**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/api`
- **Swagger Docs**: `http://localhost:4000/api/docs`
- **MinIO Console**: `http://localhost:9001` (User: `minioadmin` / Pass: `minioadmin`)
- **MinIO S3 API**: `http://localhost:9000`
- **PostgreSQL**: `localhost:5432` (DB: `neut_studio`)
- **Redis**: `localhost:6379`
