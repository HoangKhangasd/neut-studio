import { describe, it, expect, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { ProductsService } from './products.service.js';
import {
  products,
  productVariants,
  productImages,
  categories,
} from '../../database/schema/index.js';

function createMockDb(opts: {
  productRows: any[];
  variantRows?: any[];
  imageRows?: any[];
  categoryRows?: any[];
  totalCount: number;
}) {
  const limitSpy = vi.fn();
  const offsetSpy = vi.fn();
  const whereSpy = vi.fn();
  const queriedTables: any[] = [];

  const db = {
    select: vi.fn((projection?: any) => ({
      from: vi.fn((table: any) => {
        queriedTables.push(projection && 'count' in projection ? 'count' : table);

        if (projection && 'count' in projection) {
          return {
            where: vi.fn().mockResolvedValue([{ count: String(opts.totalCount) }]),
          };
        }

        if (table === products) {
          return {
            where: (clause: any) => {
              whereSpy(clause);
              return {
                orderBy: vi.fn(() => ({
                  limit: (n: number) => {
                    limitSpy(n);
                    return {
                      offset: (o: number) => {
                        offsetSpy(o);
                        return Promise.resolve(opts.productRows);
                      },
                    };
                  },
                })),
              };
            },
          };
        }

        if (table === productVariants) {
          return {
            where: vi.fn().mockResolvedValue(opts.variantRows ?? []),
          };
        }

        if (table === productImages) {
          return {
            where: vi.fn(() => ({
              orderBy: vi.fn().mockResolvedValue(opts.imageRows ?? []),
            })),
          };
        }

        if (table === categories) {
          return {
            where: vi.fn().mockResolvedValue(opts.categoryRows ?? []),
          };
        }

        throw new Error('Unexpected table queried');
      }),
    })),
  };

  return { db, limitSpy, offsetSpy, whereSpy, queriedTables };
}

describe('ProductsService.getAdminProducts', () => {
  it('defaults to page=1, limit=10 and returns batched paginated response', async () => {
    const { db, limitSpy, offsetSpy, queriedTables } = createMockDb({
      productRows: [
        { id: 'p1', title: 'Boxy Tee', slug: 'boxy-tee', categoryId: 'cat-1' },
        { id: 'p2', title: 'Empty Prod', slug: 'empty-prod', categoryId: null },
      ],
      variantRows: [
        { id: 'v1', productId: 'p1', price: 450000, salePrice: 390000, stockQuantity: 10 },
        { id: 'v2', productId: 'p1', price: 450000, salePrice: null, stockQuantity: 5 },
      ],
      imageRows: [
        { id: 'i1', productId: 'p1', imageUrl: 'https://img/1.jpg', sortOrder: 0 },
      ],
      categoryRows: [{ id: 'cat-1', name: 'Tops', slug: 'tops' }],
      totalCount: 23,
    });
    const service = new ProductsService(db);

    const res = await service.getAdminProducts();

    expect(limitSpy).toHaveBeenCalledWith(10);
    expect(offsetSpy).toHaveBeenCalledWith(0);
    expect(res).toEqual({
      data: [
        {
          id: 'p1',
          title: 'Boxy Tee',
          slug: 'boxy-tee',
          categoryId: 'cat-1',
          basePrice: 390000,
          category: { id: 'cat-1', name: 'Tops', slug: 'tops' },
          variants: [
            { id: 'v1', productId: 'p1', price: 450000, salePrice: 390000, stockQuantity: 10 },
            { id: 'v2', productId: 'p1', price: 450000, salePrice: null, stockQuantity: 5 },
          ],
          images: [{ id: 'i1', productId: 'p1', imageUrl: 'https://img/1.jpg', sortOrder: 0 }],
        },
        {
          id: 'p2',
          title: 'Empty Prod',
          slug: 'empty-prod',
          categoryId: null,
          basePrice: 0,
          category: null,
          variants: [],
          images: [],
        },
      ],
      total: 23,
      page: 1,
      totalPages: 3,
    });
    // Batch queries: count + products + variants + images + categories = 5 total (no N+1)
    expect(queriedTables).toHaveLength(5);
  });

  it('clamps invalid page and limit values (page<=0, limit<=0, limit>100)', async () => {
    const high = createMockDb({ productRows: [], totalCount: 0 });
    const highService = new ProductsService(high.db);
    const highRes = await highService.getAdminProducts({ page: -1, limit: 250 });

    expect(high.limitSpy).toHaveBeenCalledWith(100);
    expect(high.offsetSpy).toHaveBeenCalledWith(0);
    expect(highRes.page).toBe(1);

    const zero = createMockDb({ productRows: [], totalCount: 0 });
    const zeroService = new ProductsService(zero.db);
    const zeroRes = await zeroService.getAdminProducts({ page: 0, limit: 0 });

    expect(zero.limitSpy).toHaveBeenCalledWith(10);
    expect(zero.offsetSpy).toHaveBeenCalledWith(0);
    expect(zeroRes.page).toBe(1);
  });

  it('returns accurate total and totalPages when page is out of range without querying child tables', async () => {
    const { db, limitSpy, offsetSpy, queriedTables } = createMockDb({
      productRows: [],
      totalCount: 15,
    });
    const service = new ProductsService(db);

    const res = await service.getAdminProducts({ page: 4, limit: 10 });

    expect(limitSpy).toHaveBeenCalledWith(10);
    expect(offsetSpy).toHaveBeenCalledWith(30);
    expect(res).toEqual({ data: [], total: 15, page: 4, totalPages: 2 });
    expect(queriedTables).toHaveLength(2);
  });

  it('applies search condition on title and slug when search string is non-empty', async () => {
    const dialect = new PgDialect();

    const withoutSearch = createMockDb({ productRows: [], totalCount: 0 });
    await new ProductsService(withoutSearch.db).getAdminProducts();
    const baseQuery = dialect.sqlToQuery(withoutSearch.whereSpy.mock.calls[0][0]);

    const withSearch = createMockDb({ productRows: [], totalCount: 0 });
    await new ProductsService(withSearch.db).getAdminProducts({ search: ' hoodie ' });
    const searchQuery = dialect.sqlToQuery(withSearch.whereSpy.mock.calls[0][0]);

    expect(baseQuery.params).toEqual([]);
    expect(searchQuery.sql).toContain('ilike');
    expect(searchQuery.sql).toContain('"title"');
    expect(searchQuery.sql).toContain('"slug"');
    expect(searchQuery.params).toEqual(['%hoodie%', '%hoodie%']);
  });
});
