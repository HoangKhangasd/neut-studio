# Implementation Plan: Neut-Studio Storefront Audit, Bug Fixes & Refactoring

**Spec Reference:** `docs/superpowers/specs/2026-11-17-storefront-audit-and-refactor-design.md`  
**Execution Strategy:** Sequential Slices (Approach 1)  

---

## Task 1: Backend Coupons Module & Validation API
- **Files to create/modify:**
  - `apps/api/src/modules/coupons/dto/validate-coupon.dto.ts`
  - `apps/api/src/modules/coupons/coupons.service.ts`
  - `apps/api/src/modules/coupons/coupons.controller.ts`
  - `apps/api/src/modules/coupons/coupons.module.ts`
  - `apps/api/src/app.module.ts`
- **Actions:**
  - Implement `POST /api/coupons/validate` checking `isActive`, date window, `usageLimit`, `minOrderAmount`, calculate discount.
  - Register `CouponsModule` in `app.module.ts`.
- **Verification:**
  - Seed or query a coupon (e.g. `WELCOME2026` or `NEUT10` in DB), call `POST /api/coupons/validate` with valid/invalid subtotals.

---

## Task 2: Backend Atomic Coupon Usage & Order Constraints
- **Files to modify:**
  - `apps/api/src/modules/orders/orders.service.ts`
- **Actions:**
  - In `createOrder`:
    - If `couponCode` provided, validate with DB: check expiration, min order amount, usage limit.
    - If invalid, throw `BadRequestException`.
    - Atomically increment `usedCount` with `WHERE used_count < usage_limit`.
    - Enforce payment method `'COD'`.
- **Verification:**
  - Test order creation with valid coupon (increments `usedCount`), invalid coupon (throws `400 Bad Request`).

---

## Task 3: Backend Review Gate (Require COMPLETED Order)
- **Files to modify:**
  - `apps/api/src/modules/products/products.controller.ts`
  - `apps/api/src/modules/products/products.service.ts`
- **Actions:**
  - Attach `@UseGuards(JwtAuthGuard)` to `POST products/:slug/reviews`.
  - In `createProductReview`: check if `userId` has at least one order with `orderStatus === 'COMPLETED'` containing this product.
  - If not, throw `ForbiddenException`.
- **Verification:**
  - Test review submission with a user who hasn't completed an order -> returns 403 Forbidden.

---

## Task 4: Storefront Client API & Checkout Real Coupon Integration
- **Files to modify:**
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/app/checkout/page.tsx`
- **Actions:**
  - In `api.ts`: add `validateCoupon(code, subtotal)`, `trackGuestOrder(orderCode, phone)`.
  - In `checkout/page.tsx`:
    - Remove hardcoded `'NEUT10'`. Call `validateCoupon`.
    - Keep only `COD` payment method.
    - Remove mock prefilled addresses (`TP. Hồ Chí Minh`, `Quận 10`). Require actual inputs.
- **Verification:**
  - Verify checkout form accepts real coupon from DB and rejects non-existent coupons.

---

## Task 5: Storefront Navigation, Query Params & Dynamic Categories
- **Files to modify:**
  - `apps/web/src/components/store/HeaderMegaMenu.tsx`
  - `apps/web/src/components/store/HomeProductsGrid.tsx`
  - `apps/web/src/components/store/ShopCatalog.tsx`
- **Actions:**
  - Standardize query parameter on `categorySlug` and `collectionSlug`.
  - In `HomeProductsGrid.tsx`: filter by `product.category?.slug === activeTab` instead of title search.
  - In `ShopCatalog.tsx`: fetch categories dynamically via `fetchCategories()`, handle `collectionSlug`.
- **Verification:**
  - Test navigation links from Home and MegaMenu to `/shop?categorySlug=...`.

---

## Task 6: ProductDetailView Variant & Buy Now Bug Fixes
- **Files to modify:**
  - `apps/web/src/components/store/ProductDetailView.tsx`
- **Actions:**
  - Color switch: automatically pick first size in stock for new color, clamp quantity.
  - `handleAddToCart()` returns boolean.
  - `handleBuyNow`: only proceed to `/checkout` if `handleAddToCart()` returns `true`.
  - Remove `StoreInventoryDrawer` component and trigger button.
- **Verification:**
  - Verify switching colors updates size selection and doesn't allow out-of-stock purchases.

---

## Task 7: Footer & Header Cleanup
- **Files to modify:**
  - `apps/web/src/components/store/Footer.tsx`
  - `apps/web/src/components/store/HeaderMegaMenu.tsx`
- **Actions:**
  - Remove public link to `/admin` from both components.
  - Remove 3 stores section from `Footer.tsx`.
  - Update freeship text in `Footer.tsx` to 1.000.000đ.
  - Point footer policy links to real routes (`/policies/return`, `/policies/warranty`, `/size-guide`, `/policies/privacy`).
- **Verification:**
  - Inspect header and footer DOM to ensure store links and admin links are gone.

---

## Task 8: Guest Order Tracking Page (`/track-order`) & Standalone Cart Page (`/cart`)
- **Files to create:**
  - `apps/web/src/app/track-order/page.tsx`
  - `apps/web/src/app/cart/page.tsx`
- **Actions:**
  - Build Streetwear Brutalist `/track-order` page (orderCode + phone input, order progress timeline, items, totals).
  - Build Streetwear Brutalist `/cart` page (item rows, quantity adjusters, subtotal, freeship progress bar, coupon preview, direct checkout button).
- **Verification:**
  - Test visiting `/cart` and `/track-order` in browser.

---

## Task 9: Static Policy Pages & Wishlist localStorage Persistence
- **Files to create/modify:**
  - `apps/web/src/app/policies/return/page.tsx`
  - `apps/web/src/app/policies/warranty/page.tsx`
  - `apps/web/src/app/policies/privacy/page.tsx`
  - `apps/web/src/app/size-guide/page.tsx`
  - `apps/web/src/components/store/ProductCard.tsx`
- **Actions:**
  - Create the 4 static policy pages with Streetwear editorial typography.
  - In `ProductCard.tsx`: persist liked product IDs in `localStorage['neut_wishlist']`.
- **Verification:**
  - Verify all policy links open with HTTP 200 and wishlist toggle persists across page reloads.

---

## Task 10: Monorepo Build, Automated E2E Verification & Git Push
- **Actions:**
  - Run `pnpm build` across monorepo.
  - Run comprehensive E2E test script covering all acceptance criteria.
  - Git commit and push to `origin/main`.
