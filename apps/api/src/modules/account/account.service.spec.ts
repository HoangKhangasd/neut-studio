import { describe, it, expect, vi } from 'vitest';
import { AccountService } from './account.service.js';
import { products, productVariants, productImages } from '../../database/schema/index.js';

describe('AccountService.validateCartItems', () => {
  it('syncs live salePrice ?? price, clamps quantity to stock, and drops out-of-stock variants with warnings', async () => {
    const db = {
      select: vi.fn(() => ({
        from: vi.fn((table: any) => {
          if (table === productVariants) {
            return {
              where: vi.fn().mockResolvedValue([
                { id: 'v-1', productId: 'p-1', size: 'L', colorName: 'Black', price: 450000, salePrice: 390000, stockQuantity: 2 },
                { id: 'v-2', productId: 'p-1', size: 'XL', colorName: 'Black', price: 450000, salePrice: null, stockQuantity: 0 },
              ]),
            };
          }
          if (table === products) {
            return {
              where: vi.fn().mockResolvedValue([{ id: 'p-1', title: 'Boxy Tee', slug: 'boxy-tee' }]),
            };
          }
          if (table === productImages) {
            return {
              where: vi.fn(() => ({
                orderBy: vi.fn().mockResolvedValue([{ productId: 'p-1', imageUrl: 'https://img/tee.jpg' }]),
              })),
            };
          }
          throw new Error('Unexpected table');
        }),
      })),
    };
    const service = new AccountService(db);

    const res = await service.validateCartItems([
      { variantId: 'v-1', quantity: 5 },
      { variantId: 'v-2', quantity: 1 },
    ]);

    expect(res.items).toHaveLength(1);
    expect(res.items[0].price).toBe(390000);
    expect(res.items[0].quantity).toBe(2);
    expect(res.items[0].maxStock).toBe(2);
    expect(res.warnings).toHaveLength(2);
  });
});
