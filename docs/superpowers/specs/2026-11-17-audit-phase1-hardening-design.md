# Audit Phase 1: Core Security, Logic, Schema & Build Hardening — Design

**Date:** 2026-11-17  
**Size:** Project (Phase 1 of 4 from `neut_studio_audit.md`: Security, Transaction/Business Logic, Database Schema Integrity, and Monorepo/TypeScript Build Hygiene)  
**Source Audit:** `c:\Users\hoang\Downloads\neut_studio_audit.md` (Sections 2, 3, 4, 5 bugfixes, 6)

---

## 1. Intent & Why
Harden Neut-Studio's core backend, database schema, storefront state, and build pipeline against the verified security vulnerabilities, PostgreSQL transaction/race-condition bugs, data-integrity holes, and hidden TypeScript errors before layering on new subsystems (Redis rate limiting, auth refresh lifecycle, admin CRUD expansion, online payments) in Phases 2–4.

Verified non-issues in the external audit (explicitly excluded to avoid redundant churn):
- `ProductsService.getProducts` and `getProductBySlug` already filter `products.deletedAt IS NULL`.
- `apps/web/src/stores/cart-store.ts` already defines `partialize: (state) => ({ items: state.items })`.
- `coupons.usageLimit` is already `NOT NULL` in Drizzle schema (we still write null-safe SQL `or(isNull(...), lt(...))` defensively).

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
1. **Close all 4 verified security vulnerabilities** without breaking legitimate Admin or Customer flows:
   - Lock `POST /api/storage/presigned-url` with `JwtAuthGuard`, MIME allowlist (`image/jpeg`, `image/png`, `image/webp`), and folder allowlist (`products` | `reviews`; only `ADMIN` may upload to `products`, any authenticated user to `reviews`). Update all 3 FE upload callers (Admin Add Product, Admin Edit Product, Customer WriteReviewModal) to pass their JWT token.
   - Remove client-supplied `userId` from `CreateOrderDto` and attach an `OptionalJwtAuthGuard` to `POST /api/orders` so `userId` comes exclusively from a verified JWT (or `null` for guest checkout). Update `createOrder` in `apps/web/src/lib/api.ts` and `checkout/page.tsx` to send `Authorization: Bearer <token>` when logged in.
   - Require matching `phone` query parameter on `GET /api/orders/track/:orderCode` (return `400 BadRequestException` if omitted/blank), switch `orderCode` generation to `crypto.randomBytes(4).toString('hex').toUpperCase()` (`NEUT-YYYYMMDD-XXXXXXXX`) with unique-violation retry (up to 3 attempts), and mask sensitive PII (`customerEmail`, `customerPhone`, `shippingAddress.street`) in the guest tracking response. Update `track-order/page.tsx` so phone is required.
   - Enforce `isNull(users.deletedAt)` on `AuthService.login` and `getProfile`, and verify the user still exists, is not soft-deleted, and load the current DB `role` inside `JwtStrategy.validate` so soft-deleted or demoted users lose access immediately.
2. **Eliminate transaction, concurrency, and business-logic bugs:**
   - **Atomic cancellation + coupon rollback (`OrdersService.updateOrderStatus`):** Perform the status transition with an atomic conditional update (`WHERE id = :id AND order_status = :currentStatus`) returning the updated row before restoring `product_variants.stockQuantity` (eliminating double-restoration race condition). If the cancelled order recorded a `couponId`, decrement `coupons.usedCount` (clamped `>= 0`) and delete matching `coupon_usages` rows for `orderId` inside the same transaction.
   - **Safe coupon usage tracking (`OrdersService.createOrder`):** Remove `.catch(() => {})` inside `db.transaction` (which risks PostgreSQL `25P02` aborted-transaction errors). Before applying a coupon for an authenticated user (`userId !== null`), query `coupon_usages` for `(couponId, userId)` and reject duplicate use with `400 BadRequestException`. Only insert `coupon_usages` when `userId` is present (and validated via JWT/DB). Store `couponId` and `couponCode` on the `orders` row.
   - **Order creation product/variant guards (`OrdersService.createOrder`):** Verify each ordered variant belongs to an active, published, non-deleted product (`products.isPublished = true AND products.deletedAt IS NULL`) and non-deleted variant (`productVariants.deletedAt IS NULL`) before decrementing stock.
   - **Nullish pricing & coupon limits (`??` instead of `||`):** Replace `salePrice || price` with `salePrice ?? price` across `orders.service.ts` and `products.service.ts`, and replace `if (coupon.usageLimit && ...)` with `if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && ...)` across `orders.service.ts` and `coupons.service.ts` (plus null-safe `or(isNull(coupons.usageLimit), lt(coupons.usedCount, coupons.usageLimit))` on atomic increment).
   - **Remove N+1 query in `OrdersService.getMyOrders`:** Batch-load `order_items` with `inArray(orderItems.orderId, orderIds)`.
   - **Public catalog & review integrity (`ProductsService`):**
     - `getProductBySlug`: filter `eq(products.isPublished, true)` in addition to `deletedAt IS NULL`.
     - `getCollectionBySlug`: filter `eq(collections.isActive, true)`.
     - `deleteProductAdmin`: also set `isPublished: false` alongside `deletedAt`.
     - `getProducts`: when `categorySlug` is provided and no matching category exists, return `{ data: [], total: 0, page, totalPages: 0 }` instead of ignoring the filter.
     - `calculateFit`: guard `heightCm <= 0 || weightKg <= 0` with `BadRequestException` (and `@Min(50)`/`@Min(20)` on `FitFinderDto`), and factor `bodyType` (`slim` shifts BMI threshold / sizing down slightly, `full` shifts up) into the calculation so `bodyType` is actually used.
     - `createProductReview`: prevent duplicate review by the same `(userId, productId)` (`ConflictException`), derive `customerName` from the authenticated user's DB `fullName` (fallback to `dto.customerName`), and validate/derive `purchasedSize` against the user's actual completed order item for that product.
   - **Frontend Cart Store guard (`cart-store.ts`):** Reject/no-op `addItem` when `item.maxStock <= 0 || quantity <= 0`.
3. **Database Schema Integrity (`apps/api/src/database/schema/` + `pnpm db:push`):**
   - `orders.schema.ts`: add nullable `couponId` (`uuid` FK -> `coupons.id`, `onDelete: 'set null'`) and `couponCode` (`varchar(50)`), plus `CHECK` constraints `subtotal >= 0`, `shipping_fee >= 0`, `discount_amount >= 0`, `total_amount >= 0`.
   - `coupons.schema.ts`: add `.references(() => orders.id, { onDelete: 'cascade' })` on `couponUsages.orderId`.
   - `product-variants.schema.ts`: strengthen `chk_sale_price_valid` to `sale_price IS NULL OR (sale_price >= 0 AND sale_price <= price)`, and convert `sku` + `(productId, colorName, size)` uniqueness to partial unique indexes (`WHERE deleted_at IS NULL`).
   - `users.schema.ts`: convert `users.email` uniqueness to a partial unique index (`WHERE deleted_at IS NULL`).
4. **Monorepo, Config & TypeScript Hygiene:**
   - Fix the 2 pre-existing TypeScript errors (`categoryId?: string | null` on `AdminProduct`, `category?: Category | null` on `Product` in `apps/web/src/lib/types.ts`) so `pnpm --filter @neut/web exec tsc --noEmit` exits `0`.
   - Remove `typescript: { ignoreBuildErrors: true }` from `apps/web/next.config.ts`.
   - Read CORS origins in `apps/api/src/main.ts` from `CORS_ORIGINS` env var (comma-separated, defaulting to `http://localhost:3000,http://127.0.0.1:3000`).
   - Remove redundant `apps/api/package-lock.json` and `apps/web/package-lock.json` (workspace uses `pnpm`).
   - Update `.env.example` to include `NEXT_PUBLIC_API_URL` and `CORS_ORIGINS`.

### Non-Goals (Deferred to Phases 2–4)
- Redis connection, `@nestjs/throttler` rate limiting, `/auth/refresh` HttpOnly cookie & `/auth/logout` (Phase 2).
- Admin CRUD for Coupons/Categories/Users/Reviews, server-side Cart/Address/Wishlist sync (Phase 3).
- PayOS/VNPay/VietQR online payment & webhooks, BullMQ email queue, GitHub Actions CI, `packages/types` consolidation, `graphify-out/` git cleanup (Phase 4).
- Shipping fee / free-ship threshold centralization (leave `1000000` / `30000` as-is in Phase 1; revisit with Checkout/Payment in Phase 4).
- Removing `any` across all Drizzle service injections (keep scope tight to Phase 1 bugfixes).

### Anti-Goals
- Breaking customer review photo uploads by restricting `/storage/presigned-url` to `ADMIN` only.
- Breaking guest checkout (`userId = null`) when removing `dto.userId`.
- Leaving partial unique indexes out of sync with the live local PostgreSQL database.
- Adding new npm dependencies unless strictly required (zero new dependencies needed for Phase 1).

---

## 3. Constraints
- Zero new packages added (`crypto` is Node built-in; Passport JWT + Drizzle + class-validator are already installed).
- Keep existing NestJS (`Controller → Service → Schema → DTO`) and Next.js (`apps/web/src/lib/api.ts`) architecture.
- Storage secrets (`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`): require explicit env vars via `config.getOrThrow` in `NODE_ENV === 'production'`, keeping dev fallback (`minioadmin`) for local Docker setup so local `pnpm dev` stays frictionless.
- Preserve existing Streetwear Monochrome UI styling on any touched FE form (`track-order/page.tsx`, `WriteReviewModal.tsx`).
- Commit cleanly on a feature branch (`feat/audit-phase1-hardening`); first commit the 2 pre-existing Collab UI cleanup files (`apps/web/src/components/store/HeaderMegaMenu.tsx`, `apps/web/src/app/page.tsx`) as their own commit on `main` (my call, confirmable) so Phase 1 audit diffs stay cleanly isolated.

---

## 4. Approaches Considered

1. **Approach 1 (Selected): Full Phase 1 — Security + Logic/Concurrency + Schema Push + TS/Build Hardening**
   - Applies all verified security, business logic, schema (`db:push`), FE caller, and build/config fixes together so coupon rollback on cancellation and soft-delete re-creation actually work end-to-end.
   - *Trade-off:* Modifies PostgreSQL schema (requires `pnpm db:push` and verifying existing rows satisfy new constraints).
2. **Approach 2 (Rejected): Code-Only Hardening (No DB Schema Changes)**
   - Fixes security/logic/TS in code without altering Drizzle schemas or pushing DB changes.
   - *Trade-off:* Leaves coupon rollback on cancel impossible (no `orders.couponId`), keeps soft-deleted email/SKU permanently locked by full-table unique constraints, and leaves `salePrice < 0` unguarded at DB level.

---

## 5. Key Decisions & Contracts

### 5.1 Storage Presigned URL (`POST /api/storage/presigned-url`)
- Guard: `@UseGuards(JwtAuthGuard)`.
- DTO (`PresignedUrlDto`):
  - `fileName: string` (non-empty)
  - `contentType: string` (validated with `@IsIn(['image/jpeg', 'image/png', 'image/webp'])`)
  - `folder?: 'products' | 'reviews'` (optional, defaults to `'reviews'` for `CUSTOMER` and `'products'` for `ADMIN`; if a non-`ADMIN` explicitly passes `'products'`, throw `ForbiddenException`).
- `StorageService.getPresignedPutUrl` rejects any folder not in `['products', 'reviews']` and any `contentType` not in `['image/jpeg', 'image/png', 'image/webp']`.
- FE (`uploadImageToMinIO` / `uploadReviewImageToMinIO(file, token, folder?)`): keep exported function name `uploadReviewImageToMinIO(file: File, token: string, folder?: 'products' | 'reviews')` so existing imports stay minimal, send `Authorization: Bearer ${token}` and `folder` (`'products'` from Admin pages, `'reviews'` from `WriteReviewModal`). Also fix `WriteReviewModal.tsx` to read `token` from `useAuthStore()` and pass it to both `uploadReviewImageToMinIO` and `submitProductReview` (and prompt login if not authenticated).

### 5.2 Orders Creation, Tracking & Cancellation
- **Create Order (`POST /api/orders`):**
  - Guard: `@UseGuards(OptionalJwtAuthGuard)` — new lightweight guard extending `AuthGuard('jwt')` whose `handleRequest(err, user)` returns `user || null` (never rejects anonymous guests; if an invalid/expired Bearer token is explicitly sent, return `null` or `401`? **My call:** if `Authorization` header is absent -> `null` (guest); if `Authorization` header is present but invalid/expired -> throw `UnauthorizedException` so logged-in users don't silently place detached guest orders with an expired token!).
  - Remove `userId` from `CreateOrderDto`. Controller passes `@CurrentUser('id') userId?: string` into `ordersService.createOrder(dto, userId)`.
  - FE: `createOrder(payload, token?: string)` attaches `Authorization: Bearer ${token}` when `token` is truthy; `checkout/page.tsx` removes `userId` from payload and passes `token` from `useAuthStore()`.
  - Variant + parent product check inside transaction: verify variant exists, `variant.deletedAt IS NULL`, parent product exists, `prod.isPublished === true`, and `prod.deletedAt IS NULL` before atomic stock decrement.
  - Coupon check inside transaction: if `userId` is present, check `couponUsages` for `(coupon.id, userId)` and throw `BadRequestException('Bạn đã sử dụng mã giảm giá này trước đó')` if found. Atomic coupon increment uses `or(isNull(coupons.usageLimit), lt(coupons.usedCount, coupons.usageLimit))`. Persist `couponId: appliedCoupon?.id ?? null` and `couponCode: appliedCoupon?.code ?? null` on `orders`. Insert `couponUsages` ONLY when `appliedCoupon && userId` WITHOUT `.catch(() => {})`.
  - Order code: `NEUT-${YYYYMMDD}-${crypto.randomBytes(4).toString('hex').toUpperCase()}` with retry up to 3 times on unique-constraint error (`code === '23505'`).
- **Track Order (`GET /api/orders/track/:orderCode`) & Post-Checkout Receipt (`/order-success`, `/account`)** *(updated after builder check; dual-mode auth + sessionStorage receipt is my call, confirmable)*:
  - Attach `@UseGuards(OptionalJwtAuthGuard)` to `GET /api/orders/track/:orderCode`.
  - **Authenticated owner or `ADMIN`** (`req.user` present and `order.userId === req.user.id || req.user.role === 'ADMIN'`): `phone` is optional and the endpoint returns **full unmasked** order details (keeps `/account` → `/order-success?code=...` working with live status and zero phone in URL).
  - **Guest / non-owner**: `phone` query param is **strictly required** (`!phone?.trim()` -> `BadRequestException('Vui lòng nhập số điện thoại đặt hàng để tra cứu')`), must match `orders.customerPhone`, and response masks PII:
    - `customerPhone`: show first 3 + `****` + last 3 (e.g. `090****233`).
    - `customerEmail`: mask local part leaving first 2 chars (e.g. `ng***@gmail.com`).
    - `shippingAddress.street`: mask to `'***'` (keep `ward`, `district`, `province` for delivery confirmation).
  - **FE callers:**
    - `track-order/page.tsx`: make phone input required (`BẮT BUỘC *`), validate non-empty before submit; support optional `?code=` query param to prefill `orderCode`.
    - `checkout/page.tsx`: store the `createOrder` response in `sessionStorage` under `neut_last_order` before redirecting to `/order-success?code=${result.orderCode}`.
    - `OrderSuccessContent.tsx`: read `token` from `useAuthStore()`; if `token` exists, call `trackOrder(orderCode, token)` (sends `Authorization: Bearer <token>`) to show live unmasked details; otherwise check `sessionStorage.getItem('neut_last_order')` matching `orderCode` so guest buyers immediately see their **full unmasked confirmation receipt** without putting `phone` in the URL; if neither exists (cold guest link), show a friendly prompt with a direct link to `/track-order?code=${orderCode}` to verify with their phone number.
- **Cancel Order (`PATCH /api/orders/admin/:id/status`):**
  - Inside transaction: read `currentOrder`, validate transition, then run conditional `UPDATE orders SET order_status = newStatus, updated_at = NOW() WHERE id = :id AND order_status = :currentStatus RETURNING *`. If 0 rows updated, throw `ConflictException('Trạng thái đơn hàng đã thay đổi, vui lòng tải lại')`.
  - Only after conditional update succeeds with `newStatus === 'CANCELLED'`: restore `productVariants.stockQuantity` AND if `currentOrder.couponId` is set, decrement `coupons.usedCount = GREATEST(0, used_count - 1)` and delete `couponUsages` where `orderId = id`.

### 5.3 Auth & JWT Verification
- `AuthService.login` and `AuthService.getProfile`: filter `and(eq(users.email, ...), isNull(users.deletedAt))` / `and(eq(users.id, userId), isNull(users.deletedAt))`.
- `AuthService.register`: check existing active user with `and(eq(users.email, ...), isNull(users.deletedAt))` (matches partial unique index).
- `JwtStrategy`: inject `@Inject(DRIZZLE) private readonly db: any`, look up user by `payload.sub` with `isNull(users.deletedAt)`. If not found, throw `UnauthorizedException`. Return `{ id: user.id, email: user.email, role: user.role }` using live DB `role`.

### 5.4 Products & Reviews
- `getProductBySlug`: require `eq(products.isPublished, true)` + `isNull(products.deletedAt)`.
- `getCollectionBySlug`: require `eq(collections.isActive, true)`.
- `deleteProductAdmin`: set `{ deletedAt: new Date(), isPublished: false, updatedAt: new Date() }`.
- `getProducts`: if `query.categorySlug` is set and category lookup returns null, immediately return `{ data: [], total: 0, page, totalPages: 0 }`.
- `calculateFit`: validate `heightCm > 0` and `weightKg > 0` (`@Min(50)`, `@Min(20)` on DTO + guard in service); apply `bodyType` adjustment (`slim` reduces effective BMI by `1.5`, `full` increases effective BMI by `1.5`, `balanced` = `0`).
- `createProductReview`:
  - Check existing review for `(userId, prod.id)`; if found throw `ConflictException('Bạn đã đánh giá sản phẩm này rồi')`.
  - Fetch `eligibleOrderItem` joining `orders` and `orderItems` (selecting `orderItems.variantSize`) and user's `fullName` from `users`. Use DB `user.fullName` (fallback `dto.customerName`) and `eligibleOrderItem.variantSize` (fallback `dto.purchasedSize`) so client cannot spoof verified review metadata.

### 5.5 Schema Migration Notes
- Replacing `.unique()` on `users.email` and `productVariants.sku` with Drizzle `uniqueIndex(...).on(...).where(sql\`${table.deletedAt} IS NULL\`)` requires dropping the old full-table unique constraint/index when pushing. Verify `pnpm --filter @neut/api db:push` succeeds cleanly against the local PostgreSQL 16 database without data loss.
- Note on `coupons.schema.ts`: importing `orders` from `./orders.schema.js` inside `coupons.schema.ts` creates a circular ESM import only if `orders.schema.ts` also imports `coupons.schema.ts` (`orders.couponId -> coupons.id`). **To avoid circular runtime import issues**, define `couponUsages` in `orders.schema.ts` (re-exported from `schema/index.ts`) OR keep `coupons` in `coupons.schema.ts` (no import of `orders`), have `orders.schema.ts` import `coupons` (`orders.couponId -> coupons.id`), and move `couponUsages` to `orders.schema.ts` (re-exporting from `coupons.schema.ts` or `schema/index.ts` so all callers stay unaffected!).

---

## 6. Left to the Builder
- Exact error-message wording in Vietnamese (consistent with existing tone).
- Unit test file layout and helper factories under Vitest (`apps/api`) and `node --test` (`apps/web`).
- Whether to include `forbidNonWhitelisted` in `ValidationPipe` (keep `whitelist: true, forbidNonWhitelisted: false` so unknown extra FE fields don't accidentally cause 400s while still stripping `userId` silently — or test that `userId` is stripped and ignored).
- Checking `apps/web/src/components/store/WriteReviewModal.tsx` UI copy if user is not logged in (disable/show message prompting login).
