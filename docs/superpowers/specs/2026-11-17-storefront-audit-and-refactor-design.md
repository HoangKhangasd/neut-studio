# Design Specification: Neut-Studio Storefront Audit, Bug Fixes & Refactoring

**Date:** 2026-11-17  
**Status:** In Review / Ready for Implementation  
**Target:** Monorepo (`apps/api`, `apps/web`, `packages/types`)  
**Scope:** Phase 1 (Core logic fixes, real coupons, variant synchronization, checkout COD, store removal, review permission lock) + Phase 2 (Dynamic categories/variants, `/track-order`, `/cart`, localStorage Wishlist, static policy pages). *Google OAuth & Email Forgot Password are explicitly excluded per user decision.*

---

## 1. Context & Objectives

Following the Admin CMS upgrade, the Storefront currently has architectural debt and discrepancies:
1. **Broken Filters & Query Params:** Mismatches between `categorySlug` (Home Bento), `category` (Header Mega Menu), and hardcoded `CATEGORIES` in `ShopCatalog.tsx`.
2. **Mock Coupon vs. Real Coupon:** Frontend hardcodes `'NEUT10'` (10% max 100k) without checking the database. Backend `orders.service.ts` lacks validation for expiration dates, minimum order amounts, and race-free usage increments.
3. **Variant Selection & Buy-Now Glitches:** Switching colors doesn't reset or clamp size/stock in `ProductDetailView.tsx`. `handleBuyNow` can proceed to checkout even when items are out of stock.
4. **Outdated Storefront Features:** Store locations drawer and footer links still exist despite the decision to eliminate physical stores; checkout offers mock online payment options (`PAYOS`, `VNPAY`) when only `COD` is active; inconsistent Freeship thresholds (500k in Footer vs 1M elsewhere); public link to `/admin` exposed in header/footer.
5. **Review Gate Missing:** Any user or guest can submit product reviews without verifying if they actually bought and received the product.
6. **Missing Phase 2 Pages:** Lack of guest order tracking (`/track-order`), standalone shopping cart (`/cart`), persistent wishlist, and static policy pages.

---

## 2. Approach Selection

- **Approach 1 (Sequential Slices - Approved):** Implement layered slices from Backend API security & validation $\rightarrow$ Storefront Core Shopping $\rightarrow$ Navigation & Dynamic Catalogs $\rightarrow$ Phase 2 Pages. Each slice is immediately verified with automated tests.
- **Approach 2 (Swarm Parallelism):** Considered and deferred in favor of Approach 1 to avoid token overhead, race conditions on shared types, and ensure deterministic verification.

---

## 3. Detailed Architecture & Interface Changes

### 3.1. Backend API (`apps/api`)

#### A. New Dedicated Coupons Module (`apps/api/src/modules/coupons`)
- **Endpoint:** `POST /api/coupons/validate`
  - **Body DTO:** `{ code: string, subtotal: number }`
  - **Logic:**
    1. Query `coupons` table by uppercase `code`.
    2. Check `isActive === true`.
    3. Check `now >= startDate && now <= endDate`.
    4. Check `usedCount < usageLimit`.
    5. Check `subtotal >= minOrderAmount`.
    6. Calculate `discountAmount` (Percent with `maxDiscountAmount` cap or Fixed amount).
    7. Return:
       ```json
       {
         "valid": true,
         "code": "NEUT10",
         "discountType": "PERCENT",
         "discountValue": 10,
         "discountAmount": 75000,
         "message": "Áp dụng mã giảm giá thành công!"
       }
       ```
    8. If invalid: return `{ valid: false, discountAmount: 0, message: "Lý do không hợp lệ" }` with `400 Bad Request` or `200` with `valid: false`.
- Register `CouponsModule` in `app.module.ts`.

#### B. Atomic Coupon & Order Enforcement (`orders.service.ts`)
- In `createOrder`:
  - If `dto.couponCode` is provided:
    - Look up coupon. If expired, below `minOrderAmount`, or exhausted, throw `BadRequestException('Mã giảm giá không hợp lệ hoặc đã hết lượt sử dụng')`.
    - Atomically increment `usedCount` with SQL condition:
      `UPDATE coupons SET used_count = used_count + 1 WHERE id = coupon.id AND used_count < usage_limit RETURNING id`
      If no row updated, throw `BadRequestException('Mã giảm giá vừa hết lượt sử dụng')`.
  - Validate payment method: only accept `'COD'`.
  - Clean `paymentStatus`: always `'PENDING'` for COD.

#### C. Review Gate Enforcement (`products.service.ts` & `products.controller.ts`)
- In `POST /api/products/:slug/reviews`:
  - Require `@UseGuards(JwtAuthGuard)`.
  - In `createProductReview(slug, dto, userId)`:
    - Query `orders` joined with `order_items` where `orders.userId = userId` and `orders.orderStatus = 'COMPLETED'` and `order_items.variantId IN (SELECT id FROM product_variants WHERE productId = prod.id)`.
    - If count is 0: throw `ForbiddenException('Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và đơn hàng được giao thành công (COMPLETED)')`.

---

### 3.2. Frontend Storefront (`apps/web`)

#### A. Client API Client (`apps/web/src/lib/api.ts`)
- Add `validateCoupon(code: string, subtotal: number): Promise<{ valid: boolean; discountAmount: number; message: string }>`
- Add `trackOrder(orderCode: string, phone: string): Promise<CustomerOrder>`

#### B. Navigation, Query Params & Dynamic Categories
- **Query Params Standard:** Standardize on `categorySlug` (or fallback compatible `category`) and `collectionSlug`.
- **`HeaderMegaMenu.tsx`:**
  - Remove public `/admin` link.
  - Links to `/shop?categorySlug=tops`, `/shop?categorySlug=bottoms`, `/shop?categorySlug=accessories`, `/shop?categorySlug=bags`, `/shop?collectionSlug=collab-all-blacks`.
- **`HomeProductsGrid.tsx`:**
  - Tab filtering matches `product.category?.slug === activeTab` instead of searching titles for "áo", "hoodie", "quần".
  - Clean unused variable `s`.
- **`ShopCatalog.tsx`:**
  - Load `categories` dynamically from `fetchCategories()`.
  - Read `collectionSlug` from URL search params and pass to `fetchProducts`.
  - Skip redundant fetch on first mount if query params match `initialProducts`.

#### C. Product Details & Variant Fixes (`ProductDetailView.tsx`)
- When `selectedColor` changes:
  - Find all variants matching new color.
  - Check if currently `selectedSize` exists in new color's variants with `stockQuantity > 0`. If yes, keep it; if not, automatically select the first size in stock.
  - Clamp `quantity` to `Math.min(quantity, activeVariant.stockQuantity)`.
- `handleAddToCart()` returns `boolean` (`true` on success, `false` on failure or out of stock).
- `handleBuyNow`: only calls `router.push('/checkout')` if `handleAddToCart()` returned `true`.
- Remove `StoreInventoryDrawer` component and trigger button entirely.

#### D. Checkout Clean Up (`apps/web/src/app/checkout/page.tsx`)
- Payment methods: Only `COD` is available. Remove `PAYOS` and `VNPAY` options.
- Coupon: Remove hardcoded `'NEUT10'`. Connect `handleApplyCoupon` to `validateCoupon(couponInput, subtotal)`. Show real error message if invalid.
- Address form: Remove pre-filled mock defaults (`TP. Hồ Chí Minh`, `Quận 10`, `Phường 12`). Require customer to input valid address. Customer email is optional if customer phone is provided.

#### E. Footer & Global Cleanup (`Footer.tsx`)
- Remove hardcoded 3 stores section.
- Synchronize Freeship text: *"Miễn Phí Giao Hàng Toàn Quốc - Cho mọi đơn hàng có giá trị từ 1.000.000đ"*.
- Remove public link to `/admin`.
- Link policies to real static routes (`/policies/return`, `/policies/warranty`, `/size-guide`, `/policies/privacy`).

#### F. Reviews Gate UI (`ProductReviewsSection.tsx` & `WriteReviewModal.tsx`)
- If user not logged in: button "Viết đánh giá" opens `AuthModal`.
- If user logged in: verify eligible orders before opening review form, or handle 403 Forbidden with user-friendly alert.

#### G. Phase 2 New Pages & Features
1. **`/track-order` (`apps/web/src/app/track-order/page.tsx`):**
   - Form for guest: Mã đơn hàng (e.g. `NEUT-20261116-1234`) + Số điện thoại đặt hàng.
   - Calls `fetchTrackOrder(orderCode, phone)`.
   - Displays timeline badge (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`), delivery address, items list, subtotal, discount, total.
2. **`/cart` (`apps/web/src/app/cart/page.tsx`):**
   - Standalone full-page shopping cart with item list, size/color info, quantity adjusters, delete item, freeship progress bar, coupon preview input, and direct checkout CTA.
3. **Wishlist Persistence (`ProductCard.tsx`):**
   - Read/write `neut_wishlist` IDs in `localStorage`.
   - Toggle icon active state persists across reloads.
4. **Policy Pages:**
   - `/policies/return` (Chính sách đổi trả 15 ngày)
   - `/policies/warranty` (Chính sách bảo hành hình in & chất liệu)
   - `/policies/privacy` (Chính sách bảo mật)
   - `/size-guide` (Bảng quy chuẩn size Streetwear Neut-Studio)

---

## 4. Verification & Acceptance Criteria

1. **Coupon API:** `POST /api/coupons/validate` correctly validates coupon existence, date range, min order amount, and usage limit.
2. **Order Placement:** Checkout succeeds with COD and real coupons; rejects invalid coupons; decrements coupon usage atomically.
3. **Review Restriction:** Regular user without a completed order for product receives 403 when trying to review.
4. **Catalog Navigation:** Clicking tabs on Home or links in MegaMenu navigates to `/shop?categorySlug=...` and filters products correctly.
5. **No Broken Links / Stores:** Zero mentions of physical store inventory; zero public `/admin` links in storefront header/footer; policy links load dedicated pages.
6. **New Pages:** `/track-order` and `/cart` render properly with full Streetwear Brutalist UI styling.
7. **Build Check:** Full monorepo `pnpm build` passes with 0 errors.
