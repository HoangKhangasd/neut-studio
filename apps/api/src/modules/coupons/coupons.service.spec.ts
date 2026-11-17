import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { CouponsService } from './coupons.service.js';

describe('CouponsService.validateCoupon', () => {
  it('treats usageLimit === 0 as exhausted rather than unlimited', async () => {
    const db = {
      query: {
        coupons: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'c-1',
            code: 'ZERO',
            discountType: 'PERCENT',
            discountValue: 10,
            usageLimit: 0,
            usedCount: 0,
            minOrderAmount: 0,
            startDate: new Date(Date.now() - 60_000),
            endDate: new Date(Date.now() + 60_000),
            isActive: true,
          }),
        },
      },
    };
    const service = new CouponsService(db);

    await expect(service.validateCoupon({ code: 'ZERO', subtotal: 500000 })).rejects.toThrow(
      BadRequestException,
    );
  });
});
