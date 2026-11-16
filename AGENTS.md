# 👕 NEUT-STUDIO — AI Agent Guidelines & Project Context

> Hệ thống website thương mại điện tử thời trang đường phố cao cấp (Streetwear Monorepo) lấy cảm hứng từ DirtyCoins, xây dựng theo chuẩn doanh nghiệp với **pnpm workspaces**, **NestJS 11** Backend, **Next.js 15** Frontend, **Drizzle ORM**, **PostgreSQL 16**, **MinIO S3**, và **Redis 7.2**.

---

## 🏛️ Cấu Trúc Monorepo & Dịch Vụ Cốt Lõi

- **Storefront (Frontend)**: `apps/web` (Next.js 15 App Router, Tailwind CSS, Zustand, TanStack Query, shadcn/ui) — Cổng `http://localhost:3000`
- **Backend API**: `apps/api` (NestJS 11, Drizzle ORM, MinIO S3, BullMQ) — Cổng `http://localhost:4000/api`, Swagger: `/api/docs`
- **Shared Types**: `packages/types` (Khai báo TypeScript Types dùng chung giữa FE và BE)
- **Hạ tầng Docker**: `infra/` (PostgreSQL `5432`, MinIO `9000`/`9001`, Redis `6379`)
- **Tài liệu & Đặc tả**: `docs/` (`ERD.md`, `ARCHITECTURE.md`, `ENGINEERING_STANDARDS.md`, `PROJECT_SPEC.md`)

---

## 📐 Quy Chuẩn Kỹ Thuật & Thiết Kế (Bắt Buộc)

1. **Nguyên Tắc Clean Code & Modular (SRP - Không God Files):**
   - Giới hạn 80 - 200 dòng mỗi component/service. Tách sub-components, custom hooks, helper utils khi vượt ngưỡng.
   - Backend phân tầng nghiêm ngặt: `Controller` (request/response/validation) $\rightarrow$ `Service` (business logic/transactions) $\rightarrow$ `Schema/Repository` (Drizzle ORM) $\rightarrow$ `DTOs` (`class-validator`).
   - Frontend: Mọi logic gọi API/caching đưa vào **Custom Hooks** kết hợp **TanStack Query (React Query)**, tuyệt đối không viết `fetch` hay `useEffect` trực tiếp trong UI components.
2. **Quy Chuẩn Streetwear Editorial UI/UX:**
   - Bảng màu Monochrome tương phản cao: Đen `#000000`, Xám đen `#111111`, Nền phụ `#F5F5F5`, Viền `#E5E5E5`, Điểm nhấn đỏ `#DC2626`.
   - Đường nét góc cạnh sắc bén: `rounded-none` ($0\text{px}$) hoặc tối đa `rounded-sm` ($2\text{px}$). Tuyệt đối tránh bo tròn mềm mại kiểu template AI (`rounded-2xl`, `rounded-3xl`, gradient tím/hồng).
   - Typography: Font Geometric Sans-serif (Inter / Plus Jakarta Sans), tiêu đề `uppercase` và `tracking-wider`.
3. **Bảo Mật & Tối Ưu Hệ Thống:**
   - Mật khẩu băm bằng **Argon2id**.
   - Tiền tệ VNĐ lưu trữ và tính toán dạng `bigint` / integer (không dùng float).
   - Tối ưu tài nguyên: Upload ảnh qua MinIO Presigned URL và nén sang `.webp` qua `sharp`.

---

## 🗄️ Cấu Trúc Cơ Sở Dữ Liệu (22 Thực Thể Drizzle ORM)

- **Người dùng & Xác thực:** `users`, `user_addresses`, `wishlists`
- **Danh mục & Sản phẩm:** `categories`, `collections`, `collection_products`, `products`, `product_variants`, `product_images`, `product_reviews`
- **Lookbook & O2O Chi nhánh:** `lookbooks`, `lookbook_hotspots`, `stores`, `store_inventories`
- **Giỏ hàng & Đơn hàng:** `carts`, `cart_items`, `orders`, `order_items`, `payment_transactions`, `coupons`, `coupon_usages`, `newsletter_leads`

---

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
