# Audit Phase 1: Core Security, Logic, Schema & Build Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native inline execution selected) task-by-task with TDD and a whole-branch final review.

**Goal:** Resolve all verified Phase 1 security holes, transaction/concurrency/business-logic bugs, database schema integrity gaps, and TypeScript/monorepo build issues from `neut_studio_audit.md`.

**Architecture:** Harden NestJS controllers/services/guards (`OptionalJwtAuthGuard`, DB-backed `JwtStrategy`, MIME/folder-restricted `StorageController`, atomic `OrdersService`, published/active-filtered `ProductsService`), push Drizzle PostgreSQL constraints & partial unique indexes via `db:push`, and update all Next.js callers + enable strict `tsc` builds.

**Tech Stack:** NestJS 12, Drizzle ORM, PostgreSQL 16, Passport JWT, class-validator, Vitest (`apps/api`), Next.js 16.4.6, Zustand, TypeScript (`apps/web`).

**Spec:** [docs/superpowers/specs/2026-11-17-audit-phase1-hardening-design.md](../../specs/2026-11-17-audit-phase1-hardening-design.md)

## Global Constraints
- Zero new npm dependencies added.
- Preserve existing NestJS (`Controller -> Service -> Schema -> DTO`) and Next.js (`apps/web/src/lib/api.ts`) structure.
- Preserve customer review uploads (JWT-authenticated users can upload to `reviews`; only `ADMIN` can upload to `products`) and guest checkout (`userId = null`).
- Keep `/order-success` and `/account` order tracking working with unmasked details for owners and immediate guest receipts without putting `phone` in URLs.
- Preserve Streetwear Monochrome styling (`rounded-none`, `border-black`, `font-mono`).

## Review Focus
1. **Guest checkout + `/order-success` receipt & `/account` tracking:** Guest immediately sees unmasked confirmation from `sessionStorage`, logged-in owners fetch live unmasked order via JWT without phone, cold guest links require phone verification and mask PII.
2. **Invalid/expired Bearer token on `OptionalJwtAuthGuard`:** Missing `Authorization` header allows guest (`null`), while a malformed/expired Bearer token throws `401` rather than silently downgrading a logged-in user to a guest order.
3. **Concurrent `CANCELLED` race condition:** Two simultaneous cancel requests execute atomic `WHERE id = :id AND order_status = :currentStatus` so stock and `coupons.usedCount` are restored at most once.
4. **Partial unique indexes on live PostgreSQL:** `pnpm --filter @neut/api db:push` cleanly drops legacy full-table unique constraints on `users.email` / `product_variants.sku` / `(product_id, color_name, size)` and installs partial unique indexes without breaking existing rows.
5. **Presigned upload authorization & path traversal:** Unauthenticated callers get `401`, customers requesting `folder: 'products'` get `403`, disallowed MIME types (`text/html`, `image/svg+xml`) or folders (`../etc`) get `400`.

---

### Task 1: Database Schema Integrity & PostgreSQL Push
**Files:**
- Modify: `apps/api/src/database/schema/orders.schema.ts`
- Modify: `apps/api/src/database/schema/coupons.schema.ts`
- Modify: `apps/api/src/database/schema/users.schema.ts`
- Modify: `apps/api/src/database/schema/product-variants.schema.ts`

- [ ] **Step 1:** Update Drizzle schemas: add `couponId`/`couponCode` + `CHECK >= 0` on `orders`, move `couponUsages` to `orders.schema.ts` with FK `orderId -> orders.id` (avoiding circular ESM import), strengthen `chk_sale_price_valid` (`salePrice >= 0 AND salePrice <= price`), switch `users.email`, `productVariants.sku`, and `(productId, colorName, size)` to partial unique indexes `WHERE deleted_at IS NULL`.
- [ ] **Step 2:** Run `pnpm --filter @neut/api build` and `pnpm --filter @neut/api db:push --force` (verifying existing DB rows satisfy constraints and partial indexes exist in `pg_indexes`).
- [ ] **Step 3:** Commit schema changes.

### Task 2: Auth & JWT Hardening (`OptionalJwtAuthGuard`, `AuthService`, `JwtStrategy`)
**Files:**
- Create: `apps/api/src/modules/auth/optional-jwt-auth.guard.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Modify: `apps/api/src/modules/auth/jwt.strategy.ts`
- Modify: `apps/api/src/modules/auth/auth.module.ts`
- Test: `apps/api/src/modules/auth/auth.service.spec.ts`, `apps/api/src/modules/auth/jwt.strategy.spec.ts`

- [ ] **Step 1:** Write failing Vitest tests for `AuthService` (soft-deleted user rejected on login/getProfile), `JwtStrategy` (soft-deleted user rejected, live DB role returned instead of stale token role), and `OptionalJwtAuthGuard` (missing header -> `null`, valid user -> `user`, present header + error/no user -> `UnauthorizedException`).
- [ ] **Step 2:** Run tests -> verify RED.
- [ ] **Step 3:** Implement `OptionalJwtAuthGuard`, DB lookup in `JwtStrategy`, `isNull(users.deletedAt)` in `AuthService`, export `OptionalJwtAuthGuard` from `AuthModule`.
- [ ] **Step 4:** Run tests -> verify GREEN. Commit.

### Task 3: Storage Presigned URL Security
**Files:**
- Modify: `apps/api/src/modules/storage/dto/presigned-url.dto.ts`
- Modify: `apps/api/src/modules/storage/storage.controller.ts`
- Modify: `apps/api/src/modules/storage/storage.service.ts`
- Test: `apps/api/src/modules/storage/storage.service.spec.ts`

- [ ] **Step 1:** Write failing tests for `StorageService` (rejects disallowed MIME types like `text/html`/`image/svg+xml`, rejects disallowed/traversal folders like `../etc`, accepts `image/jpeg|png|webp` in `products|reviews`) and `StorageController` (customer requesting `products` throws `ForbiddenException`, admin defaults to `products`, customer defaults to `reviews`).
- [ ] **Step 2:** Run tests -> verify RED.
- [ ] **Step 3:** Update `PresignedUrlDto`, `StorageController` (`@UseGuards(JwtAuthGuard)` + role-based folder guard), and `StorageService` (MIME/folder allowlists + `getOrThrow` in production).
- [ ] **Step 4:** Run tests -> verify GREEN. Commit.

### Task 4: Orders & Coupons Logic, Concurrency & Security
**Files:**
- Modify: `apps/api/src/modules/orders/dto/orders.dto.ts`
- Modify: `apps/api/src/modules/orders/orders.controller.ts`
- Modify: `apps/api/src/modules/orders/orders.service.ts`
- Modify: `apps/api/src/modules/coupons/coupons.service.ts`
- Test: `apps/api/src/modules/orders/orders.service.spec.ts`, `apps/api/src/modules/coupons/coupons.service.spec.ts`

- [ ] **Step 1:** Write failing tests covering: `createOrder` ignores body `userId` & rejects unpublished/deleted parent product & uses `salePrice ?? price` (0 VND valid) & rejects duplicate coupon use by same user & persists `couponId`/`couponCode` & generates hex orderCode with retry on `23505`; `getMyOrders` batches `orderItems` via `inArray`; `trackOrder` requires `phone` & masks PII for guests while allowing unmasked access for owner/ADMIN; `updateOrderStatus` atomic transition conflict throws `ConflictException` without double-restoring stock and rolls back `coupons.usedCount` + deletes `couponUsages`; `CouponsService.validateCoupon` handles `usageLimit === 0`.
- [ ] **Step 2:** Run tests -> verify RED.
- [ ] **Step 3:** Implement changes across `orders.dto.ts`, `orders.controller.ts`, `orders.service.ts`, and `coupons.service.ts`.
- [ ] **Step 4:** Run tests -> verify GREEN. Commit.

### Task 5: Products & Reviews Integrity
**Files:**
- Modify: `apps/api/src/modules/products/dto/products.dto.ts`
- Modify: `apps/api/src/modules/products/products.service.ts`
- Test: `apps/api/src/modules/products/products.service.spec.ts`

- [ ] **Step 1:** Write failing tests covering: `getProducts` unknown `categorySlug` returns empty `{ data: [], total: 0, page, totalPages: 0 }` and `salePrice === 0` uses `0`; `getProductBySlug` requires `isPublished = true`; `getCollectionBySlug` requires `isActive = true`; `deleteProductAdmin` sets `isPublished: false`; `calculateFit` rejects `heightCm <= 0`/`weightKg <= 0` and differentiates `bodyType: 'slim'` vs `'full'`; `createProductReview` rejects duplicate review (`ConflictException`) and uses DB `user.fullName` + `orderItems.variantSize`.
- [ ] **Step 2:** Run tests -> verify RED.
- [ ] **Step 3:** Implement changes in `products.dto.ts` and `products.service.ts`.
- [ ] **Step 4:** Run full API test suite & build -> verify GREEN. Commit.

### Task 6: Frontend Callers, Cart Store Guard & Monorepo/TS Hygiene
**Files:**
- Modify: `apps/web/src/stores/cart-store.ts` (+ `apps/web/src/stores/cart-guard.ts` / `cart-guard.test.mjs`)
- Modify: `apps/web/src/lib/types.ts`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/checkout/page.tsx`
- Modify: `apps/web/src/app/track-order/page.tsx`
- Modify: `apps/web/src/components/store/OrderSuccessContent.tsx`
- Modify: `apps/web/src/components/store/WriteReviewModal.tsx`
- Modify: `apps/web/src/app/admin/products/page.tsx`
- Modify: `apps/web/src/components/admin/EditProductModal.tsx`
- Modify: `apps/web/next.config.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `.env.example`
- Delete: `apps/api/package-lock.json`, `apps/web/package-lock.json`

- [ ] **Step 1:** Write failing test for cart add guard (`maxStock <= 0`, `quantity <= 0` rejected; valid stock clamped). Run `node --test` -> RED.
- [ ] **Step 2:** Implement `cart-store.ts` guard, update `types.ts`, `api.ts`, `checkout/page.tsx`, `track-order/page.tsx`, `OrderSuccessContent.tsx`, `WriteReviewModal.tsx`, `admin/products/page.tsx`, `EditProductModal.tsx`, `next.config.ts`, `main.ts`, `.env.example`, and delete the 2 duplicate `package-lock.json` files.
- [ ] **Step 3:** Run full verification: `pnpm --filter @neut/api test`, `node --test apps/web/src/components/admin/pagination.test.mjs apps/web/src/stores/cart-guard.test.mjs`, `pnpm --filter @neut/web exec tsc --noEmit`, `pnpm --filter @neut/api build`, `pnpm --filter @neut/web build`.
- [ ] **Step 4:** Commit Task 6, dispatch `pro` whole-branch final reviewer, fix any Critical/Important findings with RED->GREEN TDD, clean workspace.
