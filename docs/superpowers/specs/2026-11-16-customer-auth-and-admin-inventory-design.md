# Design Document: Customer Auth, Profile & Admin Inventory CMS

**Project:** Neut-Studio Streetwear E-Commerce  
**Date:** 2026-11-16  
**Status:** Pending Approval  
**Authors:** Neut Architecture Team  

---

## 1. Intent & The Why

Neut-Studio currently has a functioning catalog, shopping cart, and order placement engine. However, two essential operational pillars are missing:
1. **Customer Identity & Retention:** Customers cannot create accounts, sign in, save shipping information, or track their past orders in a personal profile. Every checkout is forced as a guest.
2. **Merchant Operations & Inventory Control:** Store managers cannot manage product inventory levels, adjust prices, toggle publication status, or add new items from the Admin UI. Currently, inventory changes require direct database manipulation or seed re-runs.

This design delivers a lightweight, robust Customer Authentication & Profile portal and an Admin Product & Inventory CMS adhering to Ponytail (YAGNI, minimal code) and Motion Design principles (streetwear tactile feedback, smooth non-jarring transitions).

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Customer Auth & Session:** Add an elegant streetwear `AuthModal` (Login & Register tabs) accessible from the Header. Persist customer sessions in a lightweight Zustand `useAuthStore`.
- **Customer Profile & Order History:** Provide a `/account` portal displaying customer info, saved delivery address, and full past order history with tracking statuses.
- **Checkout Auto-Fill:** When authenticated, automatically prefill checkout contact details and link the created order to `userId`.
- **My Orders API:** Provide `GET /orders/my-orders` for authenticated customers.
- **Admin Inventory & Product CMS:** Extend `/admin` with an "Inventory & Products" tab:
  - View all products with real-time stock levels across all variants (Size/Color).
  - Quick inline edit for variant stock quantity (`stockQuantity`) and pricing.
  - Form to create a new streetwear product with MinIO image upload integration.
- **Motion Design:** Snappy tactile micro-interactions (150–250ms, `cubic-bezier(0.2, 0, 0, 1)`), smooth slide-in and exit transitions for modals/drawers without abrupt unmounting.

### Non-Goals (YAGNI / Deferred)
- Multi-factor authentication (MFA / SMS OTP) — standard Email & Password with Bcrypt is sufficient.
- Complex RBAC permission matrix beyond existing `ADMIN` vs `CUSTOMER`.
- Third-party social logins (Google / Facebook OAuth) — deferred to keep authentication zero-dependency.

### Anti-Goals
- Adding bloated state management or heavy UI libraries (e.g., massive headless component suites when simple Tailwind + standard HTML/React suffices).
- Breaking existing guest checkout (guests can still buy without being forced to register).

---

## 3. Constraints

- **Monorepo:** Must conform to pnpm monorepo structure (`apps/api`, `apps/web`, `packages/types`).
- **Database & ORM:** Drizzle ORM on PostgreSQL 16. Existing tables (`users`, `products`, `product_variants`, `orders`) must be reused with zero breaking schema migrations.
- **Tech Stack:** NestJS 11 + Passport JWT on the backend; Next.js 16 + React 19 + Tailwind v4 + Zustand on the frontend.
- **Performance:** No heavy re-renders; lazy-load modals; keep bundle size minimal.

---

## 4. Approaches Considered

### Approach A: Standalone Auth Pages (`/login`, `/register`) vs. Modal Overlay
- **Option 1 (Separate Pages):** Traditional full-page redirects. Disrupts the customer's shopping journey and cart flow.
- **Option 2 (Streetwear Modal Overlay - Picked):** A slide-over or centered brutalist modal (`AuthModal`) accessible from anywhere without losing current page or cart state. Includes seamless redirect to `/account` or auto-close upon successful sign-in.
- **Trade-off:** Modal requires slightly more client-side state handling, but delivers a 10x better e-commerce UX.

### Approach B: Dedicated Admin Monorepo App vs. Integrated `/admin` Route
- **Option 1 (Separate `apps/admin`):** Separate Next.js application for admin. High overhead, duplicated design system, extra port/deployment pipeline.
- **Option 2 (Tabbed Portal in `apps/web/src/app/admin` - Picked):** Keep admin unified under `/admin` with JWT guard and tabbed layout (`Đơn Hàng` | `Kho & Sản Phẩm`).
- **Trade-off:** Keeps repository simple, single deployment, instant code sharing with zero monorepo bloat.

**Selected Approach:** Approach A (Modal Overlay) + Approach B (Integrated Tabbed Admin).

---

## 5. Detailed Architecture & Implementation Plan

### A. Backend API Extensions (`apps/api`)

1. **Orders Module (`apps/api/src/modules/orders`)**:
   - Add endpoint `GET /orders/my-orders`:
     - Protected by `JwtAuthGuard`.
     - Queries `orders` where `userId = current_user.id`, joins `orderItems`, ordered by `createdAt DESC`.
2. **Products Module (`apps/api/src/modules/products`)**:
   - Add endpoint `GET /products/admin/all`:
     - Protected by `JwtAuthGuard` (Admin only).
     - Returns all products (including unpublished) with their categories and full variants.
   - Add endpoint `PATCH /products/admin/variants/:variantId`:
     - Update `stockQuantity`, `price`, `salePrice`.
   - Add endpoint `PATCH /products/admin/:id`:
     - Toggle `isPublished`, `isFeatured`, or update title/description.
   - Add endpoint `POST /products/admin`:
     - Create new product with category, slug, initial variants and images.

### B. Frontend Architecture (`apps/web`)

1. **Customer Auth State (`apps/web/src/stores/auth-store.ts`)**:
   - Zustand persisted store (`neut-auth-storage`):
     - `token: string | null`
     - `user: { id, email, fullName, phone, role } | null`
     - `isAuthModalOpen: boolean`
     - `authModalTab: 'login' | 'register'`
     - Actions: `setAuth`, `logout`, `openAuthModal`, `closeAuthModal`.
2. **Auth Modal Component (`apps/web/src/components/store/AuthModal.tsx`)**:
   - Brutalist streetwear design with sharp borders, bold typography.
   - Tabs: `ĐĂNG NHẬP` / `ĐĂNG KÝ`.
   - Handles API calls to `/auth/login` and `/auth/register`.
   - Smooth entrance/exit transitions with backdrop blur.
3. **Header Integration (`HeaderMegaMenu.tsx`)**:
   - User icon in top-right:
     - If unauthenticated: opens `AuthModal`.
     - If authenticated: shows dropdown with "Tài khoản của tôi", "Lịch sử đơn hàng", and "Đăng xuất".
4. **Customer Account Portal (`apps/web/src/app/account/page.tsx`)**:
   - Profile summary: Full name, email, phone, member tier badge.
   - Order history timeline: List of past orders with order code, date, total amount, payment status, and quick order tracking detail.
5. **Checkout Auto-fill (`apps/web/src/app/checkout/page.tsx`)**:
   - Read from `useAuthStore`: if user is logged in, auto-fill `customerName`, `customerPhone`, `customerEmail`.
   - Pass `userId` in order payload to link the order to customer account.
6. **Admin Inventory CMS (`apps/web/src/app/admin/page.tsx`)**:
   - Add tab switcher: `[1] QUẢN LÝ ĐƠN HÀNG` | `[2] KHO HÀNG & BIẾN THỂ`.
   - Table of all products with variant inventory:
     - Real-time stock badge (Hết hàng: red, Sắp hết < 5: amber, Còn hàng: green).
     - Quick inline quantity increment/decrement (`+` / `-` / direct input) and price edit.
     - Toggle Publish/Unpublish status switch.
     - Modal: "Thêm sản phẩm mới" with title, category, price, sizes, and direct MinIO image upload.

---

## 6. Motion Design Specifications

- **AuthModal Animation:**
  - Backdrop: `transition-opacity duration-200 ease-out`
  - Modal Box: `transition-all duration-200 cubic-bezier(0.2, 0, 0, 1)` with subtle scale entry (`scale-95` to `scale-100`, opacity `0` to `1`).
- **Tactile Buttons:**
  - `active:scale-[0.98] transition-transform duration-100 ease-out`.
- **Inline Stock Counter:**
  - Number changes flash with subtle green/amber highlight for 300ms to confirm atomic update.

---

## 7. What is Left to the Builder

- Exact layout styling matching DirtyCoins monochrome streetwear aesthetics.
- Input validation strings and Vietnamese error messaging.
- Admin pagination/search filter logic for products.
