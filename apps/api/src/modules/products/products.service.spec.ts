import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PgDialect } from 'drizzle-orm/pg-core';
import { ProductsService } from './products.service.js';
import {
  products,
  productVariants,
  productImages,
  categories,
  productReviews,
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

    const fractional = createMockDb({ productRows: [], totalCount: 0 });
    const fractionalService = new ProductsService(fractional.db);
    const fractionalRes = await fractionalService.getAdminProducts({ page: 2.9, limit: 5.7 });

    expect(fractional.limitSpy).toHaveBeenCalledWith(5);
    expect(fractional.offsetSpy).toHaveBeenCalledWith(5);
    expect(fractionalRes.page).toBe(2);
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

describe('ProductsService public visibility, pricing, fit-finder & reviews hardening', () => {
  it('returns empty list when getProducts receives an unknown categorySlug', async () => {
    const selectSpy = vi.fn();
    const db = {
      query: { categories: { findFirst: vi.fn().mockResolvedValue(null) } },
      select: selectSpy,
    };
    const service = new ProductsService(db);

    const res = await service.getProducts({ categorySlug: 'non-existent', page: 1, limit: 10 });

    expect(res).toEqual({ data: [], total: 0, page: 1, totalPages: 0 });
    expect(selectSpy).not.toHaveBeenCalled();
  });

  it('filters isPublished=true in getProductBySlug and isActive=true in getCollectionBySlug', async () => {
    const dialect = new PgDialect();
    const prodFindFirst = vi.fn().mockResolvedValue(null);
    const colFindFirst = vi.fn().mockResolvedValue(null);
    const db = {
      query: {
        products: { findFirst: prodFindFirst },
        collections: { findFirst: colFindFirst },
      },
    };
    const service = new ProductsService(db);

    await expect(service.getProductBySlug('draft-tee')).rejects.toThrow(NotFoundException);
    const prodSql = dialect.sqlToQuery(prodFindFirst.mock.calls[0][0].where).sql;
    expect(prodSql).toContain('"is_published" = $');

    await expect(service.getCollectionBySlug('hidden-col')).rejects.toThrow(NotFoundException);
    const colSql = dialect.sqlToQuery(colFindFirst.mock.calls[0][0].where).sql;
    expect(colSql).toContain('"is_active" = $');
  });

  it('sets isPublished=false when soft-deleting a product in deleteProductAdmin', async () => {
    const setPayloads: any[] = [];
    const db = {
      update: vi.fn(() => ({
        set: vi.fn((vals: any) => {
          setPayloads.push(vals);
          return {
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ id: 'p-1' }]),
            })),
          };
        }),
      })),
    };
    const service = new ProductsService(db);

    await service.deleteProductAdmin('p-1');
    expect(setPayloads[0].isPublished).toBe(false);
    expect(setPayloads[0].deletedAt).toBeInstanceOf(Date);
  });

  it('uses salePrice === 0 via nullish coalescing in getAdminProducts', async () => {
    const { db } = createMockDb({
      productRows: [{ id: 'p1', title: 'Free Promo', slug: 'free-promo', categoryId: null }],
      variantRows: [{ id: 'v1', productId: 'p1', price: 350000, salePrice: 0, stockQuantity: 5 }],
      imageRows: [],
      totalCount: 1,
    });
    const service = new ProductsService(db);
    const res = await service.getAdminProducts();
    expect(res.data[0].basePrice).toBe(0);
  });

  it('guards calculateFit against zero/negative measurements and incorporates bodyType', () => {
    const service = new ProductsService({});

    expect(() =>
      service.calculateFit({
        heightCm: 0,
        weightKg: 65,
        bodyType: 'balanced',
        fitPreference: 'comfortable',
      }),
    ).toThrow(BadRequestException);

    // Same height/weight (170cm, 67kg -> BMI ~23.18): slim shifts down vs full shifts up
    const slim = service.calculateFit({
      heightCm: 170,
      weightKg: 67,
      bodyType: 'slim',
      fitPreference: 'comfortable',
    });
    const full = service.calculateFit({
      heightCm: 170,
      weightKg: 67,
      bodyType: 'full',
      fitPreference: 'comfortable',
    });
    expect(slim.recommendedSize).not.toBe(full.recommendedSize);
  });

  it('rejects duplicate product reviews and uses DB user fullName & purchased variantSize', async () => {
    // 1. Duplicate review rejected
    const dupDb = {
      query: {
        products: { findFirst: vi.fn().mockResolvedValue({ id: 'p-1', slug: 'tee' }) },
        productReviews: { findFirst: vi.fn().mockResolvedValue({ id: 'rev-existing' }) },
      },
    };
    const dupService = new ProductsService(dupDb);
    await expect(
      dupService.createProductReview(
        'tee',
        { customerName: 'Spoofed', rating: 5, fitScore: 0, comment: 'Nice' },
        'u-1',
      ),
    ).rejects.toThrow(ConflictException);

    // 2. Uses DB fullName and purchased variantSize
    const insertedValues: any[] = [];
    const okDb = {
      query: {
        products: { findFirst: vi.fn().mockResolvedValue({ id: 'p-1', slug: 'tee' }) },
        productReviews: { findFirst: vi.fn().mockResolvedValue(null) },
        users: { findFirst: vi.fn().mockResolvedValue({ id: 'u-1', fullName: 'Real User Name' }) },
      },
      select: vi.fn(() => ({
        from: vi.fn((table: any) => {
          if (table === productVariants) {
            return { where: vi.fn().mockResolvedValue([{ id: 'v-1' }]) };
          }
          return {
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([{ orderId: 'o-1', variantSize: 'XL' }]),
              })),
            })),
          };
        }),
      })),
      insert: vi.fn((table: any) => ({
        values: vi.fn((vals: any) => {
          if (table === productReviews) insertedValues.push(vals);
          return { returning: vi.fn().mockResolvedValue([{ id: 'rev-1', ...vals }]) };
        }),
      })),
    };
    const okService = new ProductsService(okDb);
    await okService.createProductReview(
      'tee',
      { customerName: 'Fake Name', purchasedSize: 'S', rating: 5, fitScore: 0, comment: 'Great' },
      'u-1',
    );
    expect(insertedValues[0].customerName).toBe('Real User Name');
    expect(insertedValues[0].purchasedSize).toBe('XL');
  });
});
