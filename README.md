# 👕 NEUT-STUDIO — Streetwear E-Commerce Monorepo

> Hệ thống website thương mại điện tử thời trang đường phố cao cấp lấy cảm hứng từ DirtyCoins, xây dựng theo kiến trúc **Monorepo (pnpm workspaces)** chuẩn doanh nghiệp.

---

## 📁 Cấu Trúc Dự Án (Monorepo Directory Layout)

```
Neut-Studio/
├── .superpowers/           # Cấu hình AI Pair Programming Agents
├── apps/
│   ├── api/                # NestJS 11 Backend + Drizzle ORM + MinIO S3
│   └── web/                # Next.js 15 Frontend + Tailwind CSS + Zustand
├── docs/                   # Tài liệu kiến trúc và đặc tả kỹ thuật
├── infra/                  # Hạ tầng Docker (PostgreSQL 16, MinIO, Redis)
├── packages/
│   └── types/              # Thư viện TypeScript Types chia sẻ dùng chung
├── scripts/                # Script khởi động và gieo dữ liệu
├── .env                    # Biến môi trường
├── .env.example
├── .gitattributes
├── .gitignore
├── .node-version           # Phiên bản Node.js chuẩn
├── .npmrc                  # Cấu hình pnpm hoisted linker
├── .prettierrc.json        # Định dạng code chuẩn
├── eslint.config.mjs       # Cấu hình ESLint flat config
├── package.json            # Root workspace package.json
├── pnpm-workspace.yaml     # Khai báo pnpm workspaces
├── README.md               # Hướng dẫn dự án
└── tsconfig.base.json      # Cấu hình TypeScript cơ sở
```

---

## ⚡ Hướng Dẫn Bắt Đầu Nhanh (Quick Start)

### 1. Cài đặt Dependencies
```bash
pnpm install
```

### 2. Khởi động Hạ tầng Docker (PostgreSQL, MinIO, Redis)
```bash
pnpm infra:up
```

### 3. Đồng bộ CSDL & Gieo Dữ Liệu Mẫu
```bash
pnpm db:push
pnpm db:seed
```

### 4. Chạy Toàn Bộ Hệ Thống (Development)
```bash
pnpm dev
```
- **Storefront (Frontend)**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)
- **CMS Quản trị**: [http://localhost:3000/admin](http://localhost:3000/admin) (`admin@neut.studio` / `admin123`)
