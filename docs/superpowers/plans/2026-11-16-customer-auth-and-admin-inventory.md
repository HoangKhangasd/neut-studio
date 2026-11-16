# Customer Auth, Profile & Admin Inventory CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement customer authentication, personal profile with order history, checkout auto-fill, and admin product/inventory management with streetwear motion design.

**Architecture:** Extend NestJS backend with authenticated customer order endpoints and admin product/variant CRUD endpoints; add Zustand persisted customer auth state and motion-enhanced `AuthModal` in Next.js web; expand `/admin` into a tabbed management portal for both orders and stock levels.

**Tech Stack:** NestJS 11, Drizzle ORM, PostgreSQL 16, Passport JWT, Next.js 16, React 19, Tailwind CSS v4, Zustand, MinIO S3 SDK.

**Spec:** `docs/superpowers/specs/2026-11-16-customer-auth-and-admin-inventory-design.md`

## Global Constraints

- Must conform to pnpm monorepo architecture (`apps/api`, `apps/web`, `packages/types`).
- No breaking database migrations: reuse existing PostgreSQL tables (`users`, `orders`, `order_items`, `products`, `product_variants`).
- Follow Motion Design principles: snappy 150-250ms duration, `cubic-bezier(0.2, 0, 0, 1)`, tactile button nits (`active:scale-[0.98]`), and smooth exit transitions on all modals/drawers.
- Follow Ponytail principles: minimal code, zero external state bloat, standard Zustand store, concise error handling.

## Review Focus

- Unauthenticated customer attempting to access `/account` redirects or opens `AuthModal`.
- Expired JWT token clears user session gracefully without crash or infinite redirect loop.
- Admin updating variant stock quantity with negative or non-integer values is rejected with validation error.
- Guest checkout remains 100% functional without requiring sign-in.
- Modals (`AuthModal`, Add Product Modal) animate smoothly on both opening and closing.

---

### Task 1: Backend Customer Orders API (`GET /orders/my-orders`)

**Files:**
- Modify: `apps/api/src/modules/orders/orders.controller.ts`
- Modify: `apps/api/src/modules/orders/orders.service.ts`

**Interfaces:**
- Consumes: `JwtAuthGuard`, `CurrentUser` decorator, Drizzle ORM `orders` & `orderItems` tables.
- Produces: `GET /orders/my-orders` returning `{ id, orderCode, subtotal, shippingFee, discountAmount, totalAmount, paymentMethod, paymentStatus, orderStatus, createdAt, items: OrderItem[] }[]`.

- [ ] **Step 1: Implement `getMyOrders(userId: string)` in `apps/api/src/modules/orders/orders.service.ts`**
  Query `orders` where `userId = currentUserId`, ordered by `createdAt DESC`, fetch associated `orderItems` for each order, and return.

- [ ] **Step 2: Add `GET /orders/my-orders` endpoint in `apps/api/src/modules/orders/orders.controller.ts`**
  Decorate with `@UseGuards(JwtAuthGuard)`, `@ApiBearerAuth()`, inject `@CurrentUser('id') userId: string`.

- [ ] **Step 3: Verification**
  Run `pnpm --filter @neut/api build` to verify clean compilation with no TypeScript or Drizzle typing errors.

---

### Task 2: Backend Admin Products & Inventory APIs

**Files:**
- Modify: `apps/api/src/modules/products/dto/products.dto.ts`
- Modify: `apps/api/src/modules/products/products.controller.ts`
- Modify: `apps/api/src/modules/products/products.service.ts`

**Interfaces:**
- Consumes: `JwtAuthGuard`, Drizzle ORM `products`, `productVariants`, `productImages`, `categories`.
- Produces:
  - `GET /products/admin/all`: List all products with their variants and category.
  - `PATCH /products/admin/variants/:id`: Update variant `stockQuantity`, `price`, `salePrice`.
  - `PATCH /products/admin/:id`: Update product `title`, `description`, `isPublished`, `isFeatured`.
  - `POST /products/admin`: Create new product with variants and images.

- [ ] **Step 1: Add DTOs in `apps/api/src/modules/products/dto/products.dto.ts`**
  Define `UpdateVariantStockDto`, `UpdateProductAdminDto`, `CreateProductAdminDto`.

- [ ] **Step 2: Implement Admin service methods in `apps/api/src/modules/products/products.service.ts`**
  - `getAdminProducts()`
  - `updateVariantInventory(variantId: string, dto: UpdateVariantStockDto)`
  - `updateProductAdmin(productId: string, dto: UpdateProductAdminDto)`
  - `createProductAdmin(dto: CreateProductAdminDto)`

- [ ] **Step 3: Implement Admin controller endpoints in `apps/api/src/modules/products/products.controller.ts`**
  Add routes guarded by `JwtAuthGuard`:
  - `GET /products/admin/all`
  - `PATCH /products/admin/variants/:id`
  - `PATCH /products/admin/:id`
  - `POST /products/admin`

- [ ] **Step 4: Verification**
  Run `pnpm --filter @neut/api build` to ensure clean build.

---

### Task 3: Frontend Customer Auth Store & API Client Extensions

**Files:**
- Create: `apps/web/src/stores/auth-store.ts`
- Modify: `apps/web/src/lib/types.ts`
- Modify: `apps/web/src/lib/api.ts`

**Interfaces:**
- Consumes: Zustand `persist` middleware, browser `localStorage`.
- Produces:
  - `useAuthStore` hook with `token`, `user`, `isAuthModalOpen`, `authModalTab`, `setAuth`, `logout`, `openAuthModal`, `closeAuthModal`.
  - `registerUser(dto)`
  - `fetchMyOrders(token)`
  - `fetchAdminProducts(token)`
  - `updateAdminVariantStock(variantId, data, token)`
  - `updateAdminProduct(productId, data, token)`
  - `createAdminProduct(data, token)`

- [ ] **Step 1: Update `apps/web/src/lib/types.ts`**
  Add `User`, `AuthResponse`, `AdminProduct`, `UpdateVariantPayload`, `CreateProductPayload`.

- [ ] **Step 2: Create `apps/web/src/stores/auth-store.ts`**
  Implement Zustand store with `persist` (`neut_customer_auth`), managing authentication state and auth modal visibility.

- [ ] **Step 3: Add API functions to `apps/web/src/lib/api.ts`**
  Implement `registerUser`, `fetchMyOrders`, `fetchAdminProducts`, `updateAdminVariantStock`, `updateAdminProduct`, `createAdminProduct`.

---

### Task 4: Frontend AuthModal & Header Integration (with Motion Design)

**Files:**
- Create: `apps/web/src/components/store/AuthModal.tsx`
- Modify: `apps/web/src/components/store/HeaderMegaMenu.tsx`

**Interfaces:**
- Consumes: `useAuthStore`, `loginUser`, `registerUser`.
- Produces: Streetwear Brutalist `AuthModal` component and user profile popover in Header.

- [ ] **Step 1: Create `apps/web/src/components/store/AuthModal.tsx`**
  - Streetwear brutalist design with tabs: `[ĐĂNG NHẬP]` & `[ĐĂNG KÝ]`.
  - Form validation with error alerts.
  - Motion Design: smooth backdrop fade (`transition-opacity duration-200`) and scale/fade container entrance (`duration-200 cubic-bezier(0.2, 0, 0, 1)`), tactile buttons (`active:scale-[0.98]`).

- [ ] **Step 2: Integrate `AuthModal` and User Menu into `HeaderMegaMenu.tsx`**
  - Add User icon button: opens `openAuthModal('login')` when unauthenticated.
  - When authenticated: show greeting, link to `/account`, and quick "Đăng xuất" option.
  - Mount `<AuthModal />` at layout level.

- [ ] **Step 3: Verification**
  Run `pnpm --filter @neut/web build` to verify syntax and bundle compilation.

---

### Task 5: Customer Account & Order History Portal (`/account`)

**Files:**
- Create: `apps/web/src/app/account/page.tsx`

**Interfaces:**
- Consumes: `useAuthStore`, `fetchMyOrders`.
- Produces: Responsive `/account` page with customer profile summary and interactive order history timeline.

- [ ] **Step 1: Build `apps/web/src/app/account/page.tsx`**
  - Header: Customer name, email, phone, member badge (Streetwear Citizen / Tier 1).
  - Tab / Section 1: Lịch sử đơn hàng (Order History) with orderCode, items snapshot, total, payment status, and orderStatus badge.
  - Tab / Section 2: Thông tin giao hàng mặc định.
  - Auth protection: if not logged in, prompt to open `AuthModal` or return to `/shop`.

- [ ] **Step 2: Verification**
  Verify page rendering and build pass with `pnpm --filter @neut/web build`.

---

### Task 6: Checkout Auto-Fill & Customer Order Linking

**Files:**
- Modify: `apps/web/src/app/checkout/page.tsx`

**Interfaces:**
- Consumes: `useAuthStore`, `createOrder`.

- [ ] **Step 1: Update `CheckoutPage` to use `useAuthStore`**
  - On mount, if `user` exists in `useAuthStore`, pre-populate `customerName`, `customerPhone`, `customerEmail`.
  - Include `userId: user?.id` in the order payload sent to `createOrder`.
  - Display subtle badge: "Đang đặt hàng với tài khoản: [User FullName]".

- [ ] **Step 2: Verification**
  Run `pnpm --filter @neut/web build` to ensure no regression in checkout logic.

---

### Task 7: Admin Inventory & Product Management CMS

**Files:**
- Modify: `apps/web/src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `fetchAdminProducts`, `updateAdminVariantStock`, `updateAdminProduct`, `createAdminProduct`, `uploadReviewImageToMinIO`.

- [ ] **Step 1: Add Tab Navigation in `apps/web/src/app/admin/page.tsx`**
  Tabs: `[1] QUẢN LÝ ĐƠN HÀNG` | `[2] KHO HÀNG & BIẾN THỂ`.

- [ ] **Step 2: Implement Inventory Table**
  - Display all products with cover image, category, title, publish status toggle.
  - Expandable variant rows (Size, Color, Price, Stock).
  - Quick inline stock update (`+`, `-`, or direct input) with real-time feedback.
  - Quick price update.

- [ ] **Step 3: Implement "Thêm Sản Phẩm Mới" Modal**
  - Form: Title, Category, Description, Base Price.
  - Multi-size stock generator (S, M, L, XL).
  - Direct image upload to MinIO S3 via `uploadReviewImageToMinIO`.

- [ ] **Step 4: Verification**
  Test admin login, product fetching, and inline stock updates.

---

### Task 8: Full Monorepo Build & Integration Verification

- [ ] **Step 1: Run full monorepo build**
  `pnpm build` across `@neut/types`, `@neut/api`, and `@neut/web`.
- [ ] **Step 2: End-to-end sanity check**
  Verify user registration -> login -> /account -> checkout with linked user -> admin inventory management.
