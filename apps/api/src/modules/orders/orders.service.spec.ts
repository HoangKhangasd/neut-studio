import { describe, it, expect, vi } from 'vitest';
import { OrdersService } from './orders.service.js';
import { orders, orderItems } from '../../database/schema/index.js';

function createMockDb(opts: {
  orderRows: any[];
  itemRows?: any[];
  totalCount: number;
}) {
  const limitSpy = vi.fn();
  const offsetSpy = vi.fn();
  const itemsQuerySpy = vi.fn();

  const db = {
    select: vi.fn((projection?: any) => ({
      from: vi.fn((table: any) => {
        if (projection && 'count' in projection) {
          return {
            where: vi.fn().mockResolvedValue([{ count: String(opts.totalCount) }]),
          };
        }

        if (table === orderItems) {
          itemsQuerySpy();
          return {
            where: vi.fn().mockResolvedValue(opts.itemRows ?? []),
          };
        }

        if (table === orders) {
          return {
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: (n: number) => {
                  limitSpy(n);
                  return {
                    offset: (o: number) => {
                      offsetSpy(o);
                      return Promise.resolve(opts.orderRows);
                    },
                  };
                },
              })),
            })),
          };
        }

        throw new Error('Unexpected table queried');
      }),
    })),
  };

  return { db, limitSpy, offsetSpy, itemsQuerySpy };
}

describe('OrdersService.getAdminOrders', () => {
  it('defaults to page=1 and limit=10 when query params are omitted', async () => {
    const { db, limitSpy, offsetSpy } = createMockDb({
      orderRows: [{ id: 'ord-1', orderCode: 'NEUT-1' }],
      itemRows: [{ orderId: 'ord-1', productTitle: 'Tee' }],
      totalCount: 25,
    });
    const service = new OrdersService(db);

    const res = await service.getAdminOrders();

    expect(limitSpy).toHaveBeenCalledWith(10);
    expect(offsetSpy).toHaveBeenCalledWith(0);
    expect(res).toEqual({
      data: [{ id: 'ord-1', orderCode: 'NEUT-1', items: [{ orderId: 'ord-1', productTitle: 'Tee' }] }],
      total: 25,
      page: 1,
      totalPages: 3,
    });
  });

  it('clamps invalid page and limit values (page<=0, limit<=0, limit>100)', async () => {
    const high = createMockDb({ orderRows: [], totalCount: 0 });
    const highService = new OrdersService(high.db);
    const highRes = await highService.getAdminOrders({ page: -2, limit: 500 });

    expect(high.limitSpy).toHaveBeenCalledWith(100);
    expect(high.offsetSpy).toHaveBeenCalledWith(0);
    expect(highRes.page).toBe(1);

    const zero = createMockDb({ orderRows: [], totalCount: 0 });
    const zeroService = new OrdersService(zero.db);
    const zeroRes = await zeroService.getAdminOrders({ page: 0, limit: 0 });

    expect(zero.limitSpy).toHaveBeenCalledWith(10);
    expect(zero.offsetSpy).toHaveBeenCalledWith(0);
    expect(zeroRes.page).toBe(1);
  });

  it('returns accurate total and totalPages when page is out of range without querying orderItems', async () => {
    const { db, limitSpy, offsetSpy, itemsQuerySpy } = createMockDb({
      orderRows: [],
      totalCount: 12,
    });
    const service = new OrdersService(db);

    const res = await service.getAdminOrders({ page: 5, limit: 10 });

    expect(limitSpy).toHaveBeenCalledWith(10);
    expect(offsetSpy).toHaveBeenCalledWith(40);
    expect(itemsQuerySpy).not.toHaveBeenCalled();
    expect(res).toEqual({
      data: [],
      total: 12,
      page: 5,
      totalPages: 2,
    });
  });
});
