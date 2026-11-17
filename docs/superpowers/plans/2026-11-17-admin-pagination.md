# Admin Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add consistent server-side pagination with a changeable default page size of `10` (`10 / 20 / 50`) to both Admin Orders (`/admin/orders`) and Admin Products (`/admin/products`), while keeping Admin Dashboard (`/admin`) working without regression.

**Architecture:** Unify `GET /api/orders/admin/all` and `GET /api/products/admin/all` around `{ data, total, page, totalPages }` with default `limit = 10` (clamped `1..100`), replacing the N+1 query loop in `ProductsService.getAdminProducts` with batch `inArray` queries. Share one monochrome `AdminPagination` UI component and pure pagination helper across both admin pages.

**Tech Stack:** NestJS 12, Drizzle ORM, class-validator, Vitest (`apps/api`), Next.js 16, React 19, Tailwind CSS 4, TypeScript (`apps/web`).

**Spec:** [docs/superpowers/specs/2026-11-17-admin-pagination-design.md](../../specs/2026-11-17-admin-pagination-design.md)

## Global Constraints
- Default page size is `10`; selectable options are `[10, 20, 50]`; backend clamps `page >= 1` and `limit` to `1..100`.
- Shared paginated response contract: `{ data: T[], total: number, page: number, totalPages: number }`.
- Follow existing NestJS (`Controller → Service → DTO`) and Next.js (`apps/web/src/lib/api.ts`) layers; add zero new dependencies.
- Preserve Streetwear Monochrome styling (`rounded-none`, `border-black`, `font-mono`).
- Do not stage or commit pre-existing unrelated working-tree modifications (`apps/web/package.json`, `apps/web/src/components/store/Footer.tsx`, `pnpm-lock.yaml`).

## Review Focus
1. **Out-of-range page after delete or stale page number:** Requesting `page > totalPages` must still return real `total` and `totalPages` from backend, and deleting the last item on `page > 1` must step back to `page - 1` instead of showing an empty list.
2. **Duplicate or stale fetch when searching on `page > 1`:** Submitting a search term while on `page > 1` must reset `page` to `1` and trigger one request for `page=1` with the new search query.
3. **Invalid or extreme query parameters (`page <= 0`, `limit <= 0`, `limit > 100`, `NaN`):** Backend must safely default/clamp `page` to `>= 1` and `limit` to `1..100` (default `10`) without SQL errors.
4. **Changing page size while on `page > 1`:** Selecting a new limit (`10 / 20 / 50`) must reset `page` to `1` and keep range display (`Hiển thị X–Y / tổng Z`) accurate.
5. **Admin Dashboard compatibility:** Changing `GET /api/products/admin/all` from `AdminProduct[]` to `PaginatedResponse<AdminProduct>` must not break `/admin` KPIs or low-stock variant scanning.

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/api/src/modules/orders/dto/orders.dto.ts` | Update `AdminOrderQueryDto.limit` Swagger example to `10` |
| `apps/api/src/modules/orders/orders.service.ts` | Default `limit` to `10`; count `total` before returning empty `data` |
| `apps/api/src/modules/orders/orders.service.spec.ts` | Unit tests for `getAdminOrders` pagination defaults, clamping, out-of-range `total` |
| `apps/api/src/modules/products/dto/products.dto.ts` | Add `AdminProductQueryDto` (`page`, `limit`, `search`) |
| `apps/api/src/modules/products/products.controller.ts` | Pass `@Query() query: AdminProductQueryDto` into `getAdminProducts` |
| `apps/api/src/modules/products/products.service.ts` | Paginated `getAdminProducts(query)` with `search` + batch `inArray` fetch (no N+1) |
| `apps/api/src/modules/products/products.service.spec.ts` | Unit tests for `getAdminProducts` pagination, clamping, out-of-range `total`, batch assembly |
| `apps/web/src/components/admin/pagination.ts` | Pure helpers `getVisiblePages` and `getItemRange` |
| `apps/web/src/components/admin/pagination.test.ts` | Node built-in unit tests for pagination helper edge cases |
| `apps/web/src/components/admin/AdminPagination.tsx` | Shared monochrome pagination bar (`Hiển thị X–Y / tổng Z`, `10/20/50`, `Trước`/pages/`Sau`) |
| `apps/web/src/lib/types.ts` | Export `PaginatedResponse<T>` |
| `apps/web/src/lib/api.ts` | Update `fetchAdminProducts(token, params?)` to send `page`, `limit`, `search` and return `PaginatedResponse<AdminProduct>` |
| `apps/web/src/app/admin/page.tsx` | Adapt Dashboard to `PaginatedResponse<AdminProduct>` with `limit: 100` |
| `apps/web/src/app/admin/orders/page.tsx` | Default `limit = 10`, single-fetch search submit, page clamp, integrate `AdminPagination` |
| `apps/web/src/app/admin/products/page.tsx` | Server-side `page`/`limit=10`/`search`, delete-last-item step-back, integrate `AdminPagination` |

---

### Task 1: Backend Admin Orders Pagination Defaults & Out-of-Range Fix

**Files:**
- Modify: `apps/api/src/modules/orders/dto/orders.dto.ts:66-88`
- Modify: `apps/api/src/modules/orders/orders.service.ts:234-294`
- Test: `apps/api/src/modules/orders/orders.service.spec.ts`

**Interfaces:**
- Consumes: `AdminOrderQueryDto { page?: number; limit?: number; status?: string; search?: string }`
- Produces: `OrdersService.getAdminOrders(query?: AdminOrderQueryDto): Promise<{ data: any[]; total: number; page: number; totalPages: number }>`

- [ ] **Step 1: Write the failing tests in `apps/api/src/modules/orders/orders.service.spec.ts`**

Create a minimal mocked Drizzle `db` chain (`select().from().where().orderBy().limit().offset()` and count query `select().from().where()`) and assert:

```ts
import { describe, it, expect, vi } from 'vitest';
import { OrdersService } from './orders.service.js';

describe('OrdersService.getAdminOrders', () => {
  it('defaults to page=1 and limit=10 when omitted', async () => {
    // mock count=25, page rows=[{ id: 'o1' }], items=[]
    // expect limitSpy called with 10, offsetSpy called with 0
    // expect result to match { total: 25, page: 1, totalPages: 3 }
  });

  it('clamps invalid page and limit values (page<=0, limit<=0, limit>100)', async () => {
    // query { page: -2, limit: 500 } -> limit=100, offset=0, page=1
    // query { page: 0, limit: 0 } -> limit=10, offset=0, page=1
  });

  it('returns accurate total and totalPages when page is out of range', async () => {
    // mock count=12, orderList=[] for query { page: 5, limit: 10 }
    // expect result { data: [], total: 12, page: 5, totalPages: 2 }
    // expect orderItems query NOT called
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @neut/api test -- src/modules/orders/orders.service.spec.ts`
Expected: FAIL — current `getAdminOrders` defaults `limit` to `20` and returns `total: 0, totalPages: 0` when `orderList.length === 0`.

- [ ] **Step 3: Update `OrdersService.getAdminOrders` and `AdminOrderQueryDto`**

1. In `apps/api/src/modules/orders/dto/orders.dto.ts`: update `@ApiProperty({ required: false, example: 10 })` on `AdminOrderQueryDto.limit`.
2. In `apps/api/src/modules/orders/orders.service.ts`:
   - Change default `limit` from `20` to `10`: `const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));`
   - Run the `count(*)` query before checking `orderList.length === 0` so an out-of-range page returns `{ data: [], total, page, totalPages: Math.ceil(total / limit) }` without querying `orderItems`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @neut/api test -- src/modules/orders/orders.service.spec.ts`
Expected: PASS (all 3 tests green).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/orders/dto/orders.dto.ts apps/api/src/modules/orders/orders.service.ts apps/api/src/modules/orders/orders.service.spec.ts
git commit -m "fix(api): default admin orders limit to 10 and preserve total on out-of-range page"
```

---

### Task 2: Backend Admin Products Pagination & Batch Query

**Files:**
- Modify: `apps/api/src/modules/products/dto/products.dto.ts:220-231`
- Modify: `apps/api/src/modules/products/products.controller.ts:22-31`
- Modify: `apps/api/src/modules/products/products.service.ts:394-435`
- Test: `apps/api/src/modules/products/products.service.spec.ts`

**Interfaces:**
- Produces:
  - `AdminProductQueryDto { page?: number; limit?: number; search?: string }`
  - `ProductsController.getAdminProducts(@Query() query: AdminProductQueryDto)`
  - `ProductsService.getAdminProducts(query?: AdminProductQueryDto): Promise<{ data: any[]; total: number; page: number; totalPages: number }>`

- [ ] **Step 1: Write the failing tests in `apps/api/src/modules/products/products.service.spec.ts`**

Create unit tests with a mocked Drizzle `db` verifying:

```ts
import { describe, it, expect, vi } from 'vitest';
import { ProductsService } from './products.service.js';

describe('ProductsService.getAdminProducts', () => {
  it('defaults to page=1, limit=10 and returns { data, total, page, totalPages } with batched variants, images, category, and basePrice', async () => {
    // mock count=23, prods=[p1, p2], batched variants (with salePrice on one), images, categories
    // expect limit=10, offset=0
    // expect total=23, page=1, totalPages=3
    // expect data[0].basePrice === min(salePrice || price), data[1].basePrice === 0 when no variants
    // expect category attached by categoryId
  });

  it('clamps invalid page and limit (page<=0 -> 1, limit<=0 -> 10, limit>100 -> 100)', async () => {
    // verify limit/offset arguments for { page: 0, limit: 0 } and { page: -1, limit: 250 }
  });

  it('returns accurate total and totalPages when page is out of range without querying variants/images/categories', async () => {
    // mock count=15, prods=[] for { page: 4, limit: 10 }
    // expect { data: [], total: 15, page: 4, totalPages: 2 }
    // expect db.select called only twice (products + count)
  });

  it('passes search condition when search string is non-empty', async () => {
    // call getAdminProducts({ search: 'hoodie' }) and verify where clause receives search predicate
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @neut/api test -- src/modules/products/products.service.spec.ts`
Expected: FAIL — current `getAdminProducts()` ignores query args and returns `AdminProduct[]`.

- [ ] **Step 3: Implement `AdminProductQueryDto`, controller wiring, and batched paginated `ProductsService.getAdminProducts`**

1. In `apps/api/src/modules/products/dto/products.dto.ts`: add `AdminProductQueryDto` with optional `page?: number`, `limit?: number` (`@ApiPropertyOptional({ default: 10 })`), `search?: string`, using `@IsOptional()`, `@Type(() => Number)`, `@IsNumber()`, `@IsString()`.
2. In `apps/api/src/modules/products/products.controller.ts`: import `AdminProductQueryDto` and update `getAdminProducts(@Query() query: AdminProductQueryDto)` to pass `query` to `this.productsService.getAdminProducts(query)`.
3. In `apps/api/src/modules/products/products.service.ts`: update `getAdminProducts(query?: AdminProductQueryDto)`:
   - `const page = Math.max(1, Number(query?.page) || 1);`
   - `const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));`
   - `const offset = (page - 1) * limit;`
   - Build `conditions = [sql\`${products.deletedAt} IS NULL\`]`; when `query?.search?.trim()`, push `or(ilike(products.title, \`%${term}%\`), ilike(products.slug, \`%${term}%\`))`.
   - Query `prods` with `.orderBy(desc(products.createdAt)).limit(limit).offset(offset)` and query `[{ count }]` with the same `whereClause`.
   - If `prods.length === 0`, return `{ data: [], total, page, totalPages: Math.ceil(total / limit) }`.
   - Batch-fetch `variants` (`inArray(productVariants.productId, productIds)` AND `sql\`${productVariants.deletedAt} IS NULL\``), `images` (`inArray(productImages.productId, productIds)` ordered by `asc(productImages.sortOrder)`), and `cats` (`inArray(categories.id, categoryIds)` only if `categoryIds.length > 0`).
   - Assemble `{ ...prod, basePrice, category, variants, images }` and return `{ data, total, page, totalPages: Math.ceil(total / limit) }`.

- [ ] **Step 4: Run API tests and build**

Run: `pnpm --filter @neut/api test && pnpm --filter @neut/api build`
Expected: All Vitest specs pass and NestJS build succeeds with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/products/dto/products.dto.ts apps/api/src/modules/products/products.controller.ts apps/api/src/modules/products/products.service.ts apps/api/src/modules/products/products.service.spec.ts
git commit -m "feat(api): add pagination, search, and batch loading to admin products"
```

---

### Task 3: Shared `AdminPagination` Component & Pagination Helper

**Files:**
- Create: `apps/web/src/components/admin/pagination.ts`
- Create: `apps/web/src/components/admin/pagination.test.ts`
- Create: `apps/web/src/components/admin/AdminPagination.tsx`

**Interfaces:**
- Produces:
  - `getVisiblePages(page: number, totalPages: number): Array<number | 'ellipsis'>`
  - `getItemRange(page: number, limit: number, total: number, currentCount: number): { start: number; end: number }`
  - `AdminPaginationProps`:
    ```ts
    export interface AdminPaginationProps {
      page: number;
      totalPages: number;
      total: number;
      limit: number;
      currentCount: number;
      pageSizeOptions?: number[];
      disabled?: boolean;
      onPageChange: (page: number) => void;
      onLimitChange: (limit: number) => void;
    }
    ```

- [ ] **Step 1: Write the failing test in `apps/web/src/components/admin/pagination.test.ts`**

Use Node's built-in `node:test` and `node:assert/strict`:

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getVisiblePages, getItemRange } from './pagination.ts';

describe('getVisiblePages', () => {
  it('returns all pages when totalPages <= 7', () => {
    assert.deepEqual(getVisiblePages(1, 5), [1, 2, 3, 4, 5]);
    assert.deepEqual(getVisiblePages(1, 1), [1]);
  });

  it('inserts trailing ellipsis near start', () => {
    assert.deepEqual(getVisiblePages(2, 10), [1, 2, 3, 'ellipsis', 10]);
  });

  it('inserts both ellipses in the middle', () => {
    assert.deepEqual(getVisiblePages(5, 10), [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  });

  it('inserts leading ellipsis near end', () => {
    assert.deepEqual(getVisiblePages(9, 10), [1, 'ellipsis', 8, 9, 10]);
  });
});

describe('getItemRange', () => {
  it('computes 1-based start and end for full and partial pages', () => {
    assert.deepEqual(getItemRange(1, 10, 25, 10), { start: 1, end: 10 });
    assert.deepEqual(getItemRange(3, 10, 25, 5), { start: 21, end: 25 });
  });

  it('returns 0-0 when total or currentCount is 0', () => {
    assert.deepEqual(getItemRange(1, 10, 0, 0), { start: 0, end: 0 });
    assert.deepEqual(getItemRange(5, 10, 12, 0), { start: 0, end: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/web/src/components/admin/pagination.test.ts`
Expected: FAIL with module not found (`pagination.ts`).

- [ ] **Step 3: Implement `apps/web/src/components/admin/pagination.ts` and `apps/web/src/components/admin/AdminPagination.tsx`**

1. In `pagination.ts`: implement `getVisiblePages(page, totalPages)` (return `[1..totalPages]` if `totalPages <= 7`; otherwise always include `1`, `totalPages`, and `[page-1, page, page+1]` clamped within `1..totalPages`, inserting `'ellipsis'` wherever consecutive included pages have a gap `> 1`) and `getItemRange(page, limit, total, currentCount)`.
2. In `AdminPagination.tsx`:
   - Return `null` when `total <= 0`.
   - Render monochrome streetwear bar (`p-3 border-t border-neutral-200 bg-neutral-50 text-xs font-mono`, `rounded-none`, crisp `border-black` active page button `bg-black text-white`, `aria-current="page"`).
   - Left side: `Hiển thị {start}–{end} / {total}` + page size `<select aria-label="Số mục mỗi trang">` with options `pageSizeOptions` (default `[10, 20, 50]`), calling `onLimitChange(Number(e.target.value))`.
   - Right side: `Trước` button (disabled when `disabled || page <= 1`), page number buttons / `...` spans from `getVisiblePages(page, Math.max(1, totalPages))`, `Sau` button (disabled when `disabled || page >= totalPages`).

- [ ] **Step 4: Run helper unit tests**

Run: `node --test apps/web/src/components/admin/pagination.test.ts`
Expected: PASS (all assertions pass).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/admin/pagination.ts apps/web/src/components/admin/pagination.test.ts apps/web/src/components/admin/AdminPagination.tsx
git commit -m "feat(web): add shared AdminPagination component and page range helper"
```

---

### Task 4: Frontend API Client, Admin Orders, Admin Products & Dashboard Integration

**Files:**
- Modify: `apps/web/src/lib/types.ts`
- Modify: `apps/web/src/lib/api.ts:339-352`
- Modify: `apps/web/src/app/admin/page.tsx:20-61,156-232`
- Modify: `apps/web/src/app/admin/orders/page.tsx:20-90,185-232,318-344`
- Modify: `apps/web/src/app/admin/products/page.tsx:33-125,225-295,435-445`

**Interfaces:**
- Consumes: `AdminPagination` (Task 3), `GET /api/orders/admin/all` (Task 1), `GET /api/products/admin/all` (Task 2)
- Produces: `PaginatedResponse<T>` in `apps/web/src/lib/types.ts`, updated `fetchAdminProducts(token, params?)` in `apps/web/src/lib/api.ts`

- [ ] **Step 1: Add `PaginatedResponse<T>` and update `fetchAdminProducts`**

1. In `apps/web/src/lib/types.ts`: export `PaginatedResponse<T> { data: T[]; total: number; page: number; totalPages: number }`.
2. In `apps/web/src/lib/api.ts`: update `fetchAdminProducts(token: string, params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<AdminProduct>>` to append `page`, `limit`, `search` query params identically to `fetchAdminOrders`.

- [ ] **Step 2: Update Dashboard (`apps/web/src/app/admin/page.tsx`)**

- Call `fetchAdminProducts(token, { page: 1, limit: 100 })` alongside `fetchAdminOrders(token, { limit: 100 })`.
- Add `// shortcut: dashboard loads up to 100 orders/products; move to a dedicated stats endpoint once catalog or orders exceed 100`.
- Read `prodsRes.data || []` into `products`, and store `totalProducts = prodsRes.total ?? (prodsRes.data?.length || 0)` and `totalOrders = ordersRes.total ?? (ordersRes.data?.length || 0)` for KPI & shortcut copy.

- [ ] **Step 3: Wire `AdminPagination` into Admin Orders (`apps/web/src/app/admin/orders/page.tsx`)**

- Add `limit` state defaulting to `10` and `appliedSearch` state defaulting to `''`.
- Trigger `loadOrders()` from `useEffect` on `[token, statusFilter, page, limit, appliedSearch]` (passing `limit` and `search: appliedSearch`).
- In `handleSearchSubmit`: set `appliedSearch` to `searchTerm.trim()` and `setPage(1)` (do NOT call `loadOrders()` imperatively; if already on page 1 and `appliedSearch` unchanged, call `loadOrders()` directly to refresh).
- If `res.totalPages > 0 && page > res.totalPages`, call `setPage(res.totalPages)`.
- Replace the existing `{totalPages > 1 && (...)}` block with `<AdminPagination page={page} totalPages={totalPages} total={totalCount} limit={limit} currentCount={orders.length} disabled={loading} onPageChange={setPage} onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }} />`.

- [ ] **Step 4: Wire server-side pagination + `AdminPagination` into Admin Products (`apps/web/src/app/admin/products/page.tsx`)**

- Add `page` (`1`), `limit` (`10`), `totalPages` (`1`), `totalCount` (`0`), and `appliedSearch` (`''`) states.
- Trigger `loadProducts()` from `useEffect` on `[token, page, limit, appliedSearch]`, calling `fetchAdminProducts(token, { page, limit, search: appliedSearch })`.
- Update header count to show `totalCount` (`Hiện có: <strong>{totalCount}</strong> sản phẩm trong danh mục`).
- Convert the search box into a `<form onSubmit={handleSearchSubmit}>` with submit button (matching Orders) + clear button when `searchTerm || appliedSearch` is non-empty; submitting sets `appliedSearch` and resets `page` to `1`.
- Remove client-side `filteredProducts` filter; render `products` directly from the paginated API response.
- In `handleDeleteProduct`: after deleting, if `products.length === 1 && page > 1`, call `setPage((p) => p - 1)`; otherwise call `loadProducts()` so counts and page fill stay accurate.
- If `res.totalPages > 0 && page > res.totalPages`, call `setPage(res.totalPages)`.
- Render `<AdminPagination ... />` inside a `border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` bar below the product cards grid when `totalCount > 0`.

- [ ] **Step 5: Verify builds, tests, and live API endpoints**

Run:
1. `pnpm --filter @neut/api test` → Expected: all API unit tests pass.
2. `node --test apps/web/src/components/admin/pagination.test.ts` → Expected: all web pagination helper tests pass.
3. `pnpm --filter @neut/api build && pnpm --filter @neut/web build` → Expected: both builds exit `0`.
4. Smoke-check live endpoints (`GET /api/orders/admin/all` and `GET /api/products/admin/all` with default `limit=10` and `limit=20`) using admin JWT token to verify `{ data, total, page, totalPages }` returns cleanly.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/types.ts apps/web/src/lib/api.ts apps/web/src/app/admin/page.tsx apps/web/src/app/admin/orders/page.tsx apps/web/src/app/admin/products/page.tsx
git commit -m "feat(web): integrate server-side pagination with default limit 10 in admin orders and products"
```
