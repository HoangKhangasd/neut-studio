# Admin Pagination Design — Orders & Products

**Date:** 2026-11-17  
**Size:** Small change (backend pagination consistency + 1 shared admin UI component, no schema migration, no new dependencies)

## Intent & Why
Admin users managing `/admin/orders` and `/admin/products` need consistent server-side pagination with a default of **10 items per page** and the ability to change page size on demand. Today, Orders hardcodes `limit: 15` (with basic Prev/Next only and two minor edge-case bugs), while Products loads every product in one unpaginated request using an N+1 query loop.

## Goals
- Server-side pagination on both **Admin Orders** (`/admin/orders`) and **Admin Products** (`/admin/products`).
- Default page size is **10**, changeable via a page-size selector (`10`, `20`, `50`).
- One shared `AdminPagination` component used by both pages: range summary (`Hiển thị X–Y / tổng Z`), page-size selector, `Trước` / page numbers (with ellipsis) / `Sau`.
- Reset to page `1` whenever page size, status filter, or search query changes.
- Handle edge cases cleanly: out-of-range page clamping/total reporting, deleting the last item on the last page steps back one page, search submit on `page > 1` fires only one request.
- Keep `/admin` Dashboard working without regression.

## Non-Goals & Anti-Goals
- **Non-goals:** URL query sync (`?page=&limit=`), custom free-text page-size input, server-side sorting, or refactoring admin pages to TanStack Query.
- **Anti-goals:** Breaking Dashboard's low-stock scan or total-product KPI; leaving N+1 queries in `getAdminProducts`; introducing rounded/AI-template UI styles that clash with Neut-Studio's monochrome `rounded-none` aesthetic.

## Constraints
- Follow existing NestJS (`Controller → Service → DTO`) and Next.js (`apps/web/src/lib/api.ts`) layers without adding libraries.
- Preserve Streetwear Monochrome styling (`border-black`, `rounded-none`, `font-mono`).
- Keep diff minimal (`/ponytail` mode).

## Approaches Considered
1. **Approach 1 (Selected): Server-side pagination on both pages + shared `AdminPagination`**
   - *Orders:* Reuse `GET /api/orders/admin/all`, change default `limit` to `10`, fix out-of-range `total` count when `offset >= total`, fix duplicate fetch on search when `page > 1`.
   - *Products:* Extend `GET /api/products/admin/all` with `AdminProductQueryDto` (`page`, `limit`, `search`) returning `{ data, total, page, totalPages }`, replacing the N+1 loop with batch `inArray` queries. Update `fetchAdminProducts` and its only other caller ([admin/page.tsx](file:///c:/Project/Neut-Studio/apps/web/src/app/admin/page.tsx), which will request a high limit or read `res.data` & `res.total`).
   - *Trade-off:* Touches both BE and FE (~7 files), but keeps both admin pages consistent, scales cleanly, and fixes N+1 queries.
2. **Approach 2 (Rejected): Keep Products backend unpaginated, slice on client**
   - *Trade-off:* Smaller diff and instant client filtering, but degrades as catalog grows because backend still executes N+1 queries for all products on every load.

## Decided Contracts & Behavior
- **Shared Response Shape** (both `GET /api/orders/admin/all` and `GET /api/products/admin/all`):
  `{ data: T[], total: number, page: number, totalPages: number }`
- **Backend Defaults & Limits:**
  - `page`: default `1`, min `1`
  - `limit`: default `10`, clamped `1..100` (allows Dashboard to pass `limit: 100` like it already does for orders)
  - `search`: optional string (`ILIKE` on product `title` or `slug` for products; existing `orderCode`/`customerName`/`customerPhone` for orders)
  - Always compute real `total` before returning empty `data` so `total` and `totalPages` stay accurate if `page > totalPages`.
- **Frontend UI (`apps/web/src/components/admin/AdminPagination.tsx`):**
  - Always shown when `total > 0` (so admin can still change page size even when `total <= limit` and `totalPages === 1`).
  - Page size options: `[10, 20, 50]` (my call, confirmable).
  - Products search: form submit + clear/debounced or submit button matching Orders UX so search doesn't spam requests on every keystroke (builder call: submit button matching Orders, or 300ms debounce — default to submit form + clear for exact parity with Orders).
- **Dashboard ([apps/web/src/app/admin/page.tsx](file:///c:/Project/Neut-Studio/apps/web/src/app/admin/page.tsx)):**
  - Call `fetchAdminProducts(token, { page: 1, limit: 100 })`, use `prodsRes.data` for low-stock scan and `prodsRes.total` for the total-product KPI.
  - Note (`shortcut:`): Dashboard currently uses `limit: 100` for both orders and products; upgrade to a dedicated stats endpoint once catalog/orders exceed 100.

## Left to the Builder
- Exact pagination window/ellipsis calculation (e.g., show first, last, current ± 1) and unit test covering pagination helper + backend query clamping.
- Minor responsive wrapping on small screens.
