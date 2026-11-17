import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import {
  orders,
  orderItems,
  productVariants,
  coupons,
  couponUsages,
} from '../../database/schema/index.js';

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

    const fractional = createMockDb({ orderRows: [], totalCount: 0 });
    const fractionalService = new OrdersService(fractional.db);
    const fractionalRes = await fractionalService.getAdminOrders({ page: 2.9, limit: 5.7 });

    expect(fractional.limitSpy).toHaveBeenCalledWith(5);
    expect(fractional.offsetSpy).toHaveBeenCalledWith(5);
    expect(fractionalRes.page).toBe(2);
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

describe('OrdersService.trackOrder', () => {
  const sampleOrder = {
    id: 'ord-1',
    orderCode: 'NEUT-20261117-A1B2C3D4',
    userId: 'user-owner',
    customerName: 'Nguyen Van A',
    customerPhone: '0901112233',
    customerEmail: 'nguyenvana@gmail.com',
    shippingAddress: {
      street: '123 Le Loi',
      ward: 'Ben Nghe',
      district: 'Quan 1',
      province: 'TP.HCM',
    },
    orderStatus: 'PENDING',
    totalAmount: 500000,
  };

  function createTrackDb(foundOrder: any) {
    return {
      query: { orders: { findFirst: vi.fn().mockResolvedValue(foundOrder) } },
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([{ id: 'item-1', orderId: 'ord-1' }]),
        })),
      })),
    };
  }

  it('requires phone for guest tracking and masks PII in guest response', async () => {
    const service = new OrdersService(createTrackDb(sampleOrder));

    await expect(service.trackOrder(sampleOrder.orderCode)).rejects.toThrow(BadRequestException);

    const guestRes = await service.trackOrder(sampleOrder.orderCode, '0901112233');
    expect(guestRes.customerPhone).toBe('090****233');
    expect(guestRes.customerEmail).toBe('ng***@gmail.com');
    expect(guestRes.shippingAddress.street).toBe('***');
    expect(guestRes.shippingAddress.district).toBe('Quan 1');
  });

  it('allows authenticated owner or ADMIN to view unmasked order without phone', async () => {
    const service = new OrdersService(createTrackDb(sampleOrder));

    const ownerRes = await (service as any).trackOrder(sampleOrder.orderCode, undefined, {
      id: 'user-owner',
      role: 'CUSTOMER',
    });
    expect(ownerRes.customerPhone).toBe('0901112233');
    expect(ownerRes.customerEmail).toBe('nguyenvana@gmail.com');
    expect(ownerRes.shippingAddress.street).toBe('123 Le Loi');

    const adminRes = await (service as any).trackOrder(sampleOrder.orderCode, undefined, {
      id: 'admin-1',
      role: 'ADMIN',
    });
    expect(adminRes.customerPhone).toBe('0901112233');
  });
});

describe('OrdersService.getMyOrders', () => {
  it('batch-loads orderItems with one query instead of N+1 per order', async () => {
    let selectCalls = 0;
    const db = {
      select: vi.fn(() => {
        selectCalls++;
        return {
          from: vi.fn((table: any) => {
            if (table === orders) {
              return {
                where: vi.fn(() => ({
                  orderBy: vi.fn().mockResolvedValue([{ id: 'o1' }, { id: 'o2' }]),
                })),
              };
            }
            if (table === orderItems) {
              return {
                where: vi.fn().mockResolvedValue([
                  { id: 'i1', orderId: 'o1' },
                  { id: 'i2', orderId: 'o2' },
                ]),
              };
            }
            throw new Error('Unexpected table');
          }),
        };
      }),
    };
    const service = new OrdersService(db);

    const res = await service.getMyOrders('u-1');
    expect(res).toHaveLength(2);
    expect(res[0].items).toEqual([{ id: 'i1', orderId: 'o1' }]);
    expect(res[1].items).toEqual([{ id: 'i2', orderId: 'o2' }]);
    expect(selectCalls).toBe(2);
  });
});

describe('OrdersService.updateOrderStatus', () => {
  it('prevents double stock restore on concurrent cancel and rolls back coupon usage', async () => {
    const variantUpdateSpy = vi.fn();
    const couponUpdateSpy = vi.fn();
    const couponUsageDeleteSpy = vi.fn();

    function makeTx(atomicUpdatedRows: any[]) {
      return {
        select: vi.fn(() => ({
          from: vi.fn((table: any) => ({
            where: vi.fn().mockResolvedValue(
              table === orders
                ? [{ id: 'ord-1', orderStatus: 'PENDING', couponId: 'cpn-1' }]
                : [{ id: 'oi-1', variantId: 'v-1', quantity: 2 }],
            ),
          })),
        })),
        update: vi.fn((table: any) => ({
          set: vi.fn(() => ({
            where: vi.fn(() => {
              if (table === orders) {
                return { returning: vi.fn().mockResolvedValue(atomicUpdatedRows) };
              }
              if (table === productVariants) {
                variantUpdateSpy();
                return Promise.resolve([]);
              }
              if (table === coupons) {
                couponUpdateSpy();
                return Promise.resolve([]);
              }
              return Promise.resolve([]);
            }),
          })),
        })),
        delete: vi.fn((table: any) => ({
          where: vi.fn(() => {
            if (table === couponUsages) couponUsageDeleteSpy();
            return Promise.resolve([]);
          }),
        })),
      };
    }

    // Concurrent race: conditional update affects 0 rows -> must abort without restoring stock
    const raceService = new OrdersService({
      transaction: (cb: any) => cb(makeTx([])),
    });
    await expect(raceService.updateOrderStatus('ord-1', 'CANCELLED')).rejects.toThrow(
      ConflictException,
    );
    expect(variantUpdateSpy).not.toHaveBeenCalled();
    expect(couponUpdateSpy).not.toHaveBeenCalled();

    // Normal cancel: updates atomically, restores stock, decrements coupon, deletes coupon usage
    const okService = new OrdersService({
      transaction: (cb: any) => cb(makeTx([{ id: 'ord-1', orderStatus: 'CANCELLED' }])),
    });
    const updated = await okService.updateOrderStatus('ord-1', 'CANCELLED');
    expect(updated.orderStatus).toBe('CANCELLED');
    expect(variantUpdateSpy).toHaveBeenCalledTimes(1);
    expect(couponUpdateSpy).toHaveBeenCalledTimes(1);
    expect(couponUsageDeleteSpy).toHaveBeenCalledTimes(1);
  });
});

describe('OrdersService.createOrder hardening', () => {
  const baseDto: any = {
    customerName: 'Test User',
    customerPhone: '0901112233',
    customerEmail: 'test@neut.studio',
    shippingAddress: { province: 'HCM', district: 'Q1', ward: 'BN', street: '1 Le Loi' },
    paymentMethod: 'COD',
    items: [{ variantId: 'v-1', quantity: 1 }],
  };

  it('rejects ordering a variant whose parent product is unpublished or deleted', async () => {
    const tx = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              { id: 'v-1', productId: 'p-hidden', price: 200000, salePrice: null, sku: 'SKU', colorName: 'Black', size: 'L' },
            ]),
          })),
        })),
      })),
      query: {
        products: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'p-hidden',
            title: 'Hidden Tee',
            isPublished: false,
            deletedAt: null,
          }),
        },
      },
    };
    const service = new OrdersService({ transaction: (cb: any) => cb(tx) });

    await expect(service.createOrder(baseDto)).rejects.toThrow(ConflictException);
  });

  it('uses salePrice === 0 via nullish coalescing, ignores spoofed dto.userId, and generates hex orderCode', async () => {
    const insertedOrders: any[] = [];
    const tx = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              { id: 'v-1', productId: 'p-1', price: 300000, salePrice: 0, sku: 'SKU', colorName: 'Black', size: 'L' },
            ]),
          })),
        })),
      })),
      query: {
        products: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'p-1',
            title: 'Free Promo Tee',
            isPublished: true,
            deletedAt: null,
          }),
        },
      },
      insert: vi.fn((table: any) => ({
        values: vi.fn((vals: any) => {
          if (table === orders) {
            insertedOrders.push(vals);
            return { returning: vi.fn().mockResolvedValue([{ id: 'ord-new', ...vals }]) };
          }
          if (table === orderItems) {
            return { returning: vi.fn().mockResolvedValue([{ id: 'oi-new', ...vals }]) };
          }
          return Promise.resolve([]);
        }),
      })),
    };
    const service = new OrdersService({ transaction: (cb: any) => cb(tx) });

    const created = await service.createOrder({ ...baseDto, userId: 'spoofed-victim-id' });
    expect(insertedOrders[0].userId).toBeNull();
    expect(insertedOrders[0].subtotal).toBe(0);
    expect(created.orderCode).toMatch(/^NEUT-\d{8}-[0-9A-F]{8}$/);
    expect(created.items[0].id).toBe('oi-new');
  });

  it('rejects duplicate coupon usage by the same authenticated user', async () => {
    const tx = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              { id: 'v-1', productId: 'p-1', price: 500000, salePrice: null, sku: 'SKU', colorName: 'Black', size: 'L' },
            ]),
          })),
        })),
      })),
      query: {
        products: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'p-1',
            title: 'Tee',
            isPublished: true,
            deletedAt: null,
          }),
        },
        coupons: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'cpn-1',
            code: 'NEUT10',
            isActive: true,
            discountType: 'PERCENT',
            discountValue: 10,
            usageLimit: 100,
            usedCount: 1,
            minOrderAmount: 0,
            startDate: new Date(Date.now() - 60_000),
            endDate: new Date(Date.now() + 60_000),
          }),
        },
        couponUsages: {
          findFirst: vi.fn().mockResolvedValue({ id: 'usage-existing' }),
        },
      },
    };
    const service = new OrdersService({ transaction: (cb: any) => cb(tx) });

    await expect(
      service.createOrder({ ...baseDto, couponCode: 'NEUT10' }, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
