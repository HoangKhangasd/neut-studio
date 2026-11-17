import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { Worker, Job } from 'bullmq';
import { DRIZZLE } from '../../database/database.module.js';
import { orders, paymentTransactions } from '../../database/schema/index.js';
import { OrdersService } from '../orders/orders.service.js';

export interface PayosWebhookPayload {
  orderCode: string;
  transactionId: string;
  amount: number;
  status: 'PAID' | 'CANCELLED' | 'FAILED';
  signature?: string;
}

export function computePayosSignature(
  data: { orderCode: string; transactionId: string; amount: number; status: string },
  secret: string,
): string {
  const canonical = `amount=${data.amount}&orderCode=${data.orderCode}&status=${data.status}&transactionId=${data.transactionId}`;
  return createHmac('sha256', secret).update(canonical).digest('hex');
}

export function verifyPayosSignature(
  data: { orderCode: string; transactionId: string; amount: number; status: string },
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = computePayosSignature(data, secret);
  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) return false;
  return timingSafeEqual(sigBuf, expBuf);
}

@Injectable()
export class PaymentsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentsService.name);
  private expiryWorker: Worker<{ orderId: string; orderCode: string }> | null = null;

  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  private getChecksumKey(): string {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    return isProd
      ? this.config.getOrThrow<string>('PAYOS_CHECKSUM_KEY')
      : this.config.get<string>('PAYOS_CHECKSUM_KEY', 'neut-sandbox-payos-secret');
  }

  onModuleInit() {
    if (
      this.config.get<string>('NODE_ENV') === 'test' ||
      this.config.get<string>('REDIS_DISABLED') === 'true'
    ) {
      return;
    }

    const connection = {
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.config.get<number>('REDIS_PORT', 6379)),
      maxRetriesPerRequest: null,
    };

    try {
      this.expiryWorker = new Worker<{ orderId: string; orderCode: string }>(
        'neut-order-expiry',
        async (job: Job<{ orderId: string; orderCode: string }>) => {
          await this.expireUnpaidOrder(job.data.orderId);
        },
        { connection },
      );
      this.expiryWorker.on('error', (err) => {
        this.logger.warn(`Order expiry worker warning: ${err.message}`);
      });
    } catch (err: any) {
      this.logger.warn(`Order expiry worker init skipped: ${err.message}`);
    }
  }

  async handlePayosWebhook(payload: PayosWebhookPayload, headerSignature?: string) {
    const signature = headerSignature || payload.signature;
    const secret = this.getChecksumKey();

    if (!verifyPayosSignature(payload, signature, secret)) {
      throw new UnauthorizedException('Chữ ký Webhook PayOS không hợp lệ');
    }

    return this.processPaymentSettlement(payload);
  }

  async sandboxConfirmOrder(orderCode: string) {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Không cho phép giả lập thanh toán ở môi trường production');
    }

    const order = await this.db.query.orders.findFirst({
      where: eq(orders.orderCode, orderCode.trim().toUpperCase()),
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (order.paymentMethod !== 'PAYOS') {
      throw new BadRequestException('Đơn hàng này không dùng phương thức chuyển khoản PayOS');
    }

    const payload: PayosWebhookPayload = {
      orderCode: order.orderCode,
      transactionId: `SANDBOX-${order.orderCode}-${Date.now()}`,
      amount: order.totalAmount,
      status: 'PAID',
    };
    const signature = computePayosSignature(payload, this.getChecksumKey());
    return this.handlePayosWebhook({ ...payload, signature });
  }

  private async processPaymentSettlement(payload: PayosWebhookPayload) {
    return this.db.transaction(async (tx: any) => {
      const existingTx = await tx.query.paymentTransactions.findFirst({
        where: eq(paymentTransactions.providerTransactionId, payload.transactionId),
      });
      if (existingTx) {
        return { success: true, idempotent: true, orderCode: payload.orderCode };
      }

      const order = await tx.query.orders.findFirst({
        where: eq(orders.orderCode, payload.orderCode.trim().toUpperCase()),
      });
      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng tương ứng');
      }

      if (payload.status === 'PAID' && Number(payload.amount) < Number(order.totalAmount)) {
        throw new BadRequestException('Số tiền thanh toán nhỏ hơn giá trị đơn hàng');
      }

      await tx.insert(paymentTransactions).values({
        orderId: order.id,
        provider: 'PAYOS',
        providerTransactionId: payload.transactionId,
        amount: Number(payload.amount),
        status: payload.status,
        rawPayload: payload,
      });

      if (payload.status === 'PAID') {
        await tx
          .update(orders)
          .set({
            paymentStatus: 'PAID',
            orderStatus: order.orderStatus === 'PENDING' ? 'CONFIRMED' : order.orderStatus,
            updatedAt: new Date(),
          })
          .where(and(eq(orders.id, order.id), eq(orders.paymentStatus, 'PENDING')));
      }

      return {
        success: true,
        idempotent: false,
        orderCode: order.orderCode,
        paymentStatus: payload.status === 'PAID' ? 'PAID' : order.paymentStatus,
      };
    });
  }

  async expireUnpaidOrder(orderId: string) {
    const order = await this.db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (
      !order ||
      order.paymentMethod !== 'PAYOS' ||
      order.paymentStatus !== 'PENDING' ||
      order.orderStatus !== 'PENDING'
    ) {
      return { expired: false };
    }

    await this.ordersService.updateOrderStatus(orderId, 'CANCELLED');
    this.logger.log(`[Auto-Expire] Cancelled unpaid PAYOS order ${order.orderCode} and restored stock`);
    return { expired: true, orderCode: order.orderCode };
  }

  async onModuleDestroy() {
    await this.expiryWorker?.close().catch(() => {});
  }
}
