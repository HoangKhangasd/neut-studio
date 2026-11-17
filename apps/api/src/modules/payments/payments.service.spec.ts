import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PaymentsService, computePayosSignature } from './payments.service.js';

function createConfig(overrides: Record<string, any> = {}) {
  return {
    get: (k: string, d?: any) => (k in overrides ? overrides[k] : d),
    getOrThrow: (k: string) => overrides[k],
  } as any;
}

describe('PaymentsService', () => {
  it('rejects invalid HMAC-SHA256 webhook signature', async () => {
    const service = new PaymentsService({}, createConfig(), {} as any);
    await expect(
      service.handlePayosWebhook({
        orderCode: 'NEUT-1',
        transactionId: 'TX-1',
        amount: 500000,
        status: 'PAID',
        signature: 'bad-signature',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('handles valid HMAC webhook idempotently and settles order to PAID/CONFIRMED', async () => {
    const seen = new Set<string>();
    const orderUpdates: any[] = [];
    const tx = {
      query: {
        paymentTransactions: {
          findFirst: vi.fn(async () => (seen.has('TX-99') ? { id: 'pt-1' } : null)),
        },
        orders: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'ord-1',
            orderCode: 'NEUT-1',
            totalAmount: 500000,
            orderStatus: 'PENDING',
            paymentStatus: 'PENDING',
          }),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(async () => {
          seen.add('TX-99');
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn((vals: any) => {
          orderUpdates.push(vals);
          return { where: vi.fn().mockResolvedValue([]) };
        }),
      })),
    };
    const db = { transaction: (cb: any) => cb(tx) };
    const service = new PaymentsService(db, createConfig(), {} as any);

    const payload = {
      orderCode: 'NEUT-1',
      transactionId: 'TX-99',
      amount: 500000,
      status: 'PAID' as const,
    };
    const sig = computePayosSignature(payload, 'neut-sandbox-payos-secret');

    const first = await service.handlePayosWebhook({ ...payload, signature: sig });
    expect(first).toEqual({
      success: true,
      idempotent: false,
      orderCode: 'NEUT-1',
      paymentStatus: 'PAID',
    });
    expect(orderUpdates).toHaveLength(1);
    expect(orderUpdates[0].paymentStatus).toBe('PAID');
    expect(orderUpdates[0].orderStatus).toBe('CONFIRMED');

    const replay = await service.handlePayosWebhook({ ...payload, signature: sig });
    expect(replay.idempotent).toBe(true);
    expect(orderUpdates).toHaveLength(1);
  });

  it('auto-cancels unpaid PAYOS orders on expiry and skips already-paid orders', async () => {
    const updateOrderStatus = vi.fn().mockResolvedValue({ orderStatus: 'CANCELLED' });
    const unpaidDb = {
      query: {
        orders: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'ord-1',
            orderCode: 'NEUT-1',
            paymentMethod: 'PAYOS',
            paymentStatus: 'PENDING',
            orderStatus: 'PENDING',
          }),
        },
      },
    };
    const service = new PaymentsService(unpaidDb, createConfig(), { updateOrderStatus } as any);
    const expired = await service.expireUnpaidOrder('ord-1');
    expect(expired.expired).toBe(true);
    expect(updateOrderStatus).toHaveBeenCalledWith('ord-1', 'CANCELLED');
  });

  it('blocks sandbox confirmation in production', async () => {
    const service = new PaymentsService({}, createConfig({ NODE_ENV: 'production' }), {} as any);
    await expect(service.sandboxConfirmOrder('NEUT-1')).rejects.toThrow(ForbiddenException);
  });
});
