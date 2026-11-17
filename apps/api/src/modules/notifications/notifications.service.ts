import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailJobPayload {
  type: 'order-confirmation' | 'password-reset';
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private queue: Queue<EmailJobPayload> | null = null;
  private worker: Worker<EmailJobPayload> | null = null;
  private orderExpiryQueue: Queue<{ orderId: string; orderCode: string }> | null = null;
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.fromAddress = config.get<string>('SMTP_FROM', 'Neut-Studio <no-reply@neut.studio>');
    const smtpHost = config.get<string>('SMTP_HOST');
    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(config.get<number>('SMTP_PORT', 587)),
        secure: config.get<string>('SMTP_SECURE') === 'true',
        auth: config.get<string>('SMTP_USER')
          ? {
              user: config.get<string>('SMTP_USER'),
              pass: config.get<string>('SMTP_PASS'),
            }
          : undefined,
      });
    }
  }

  onModuleInit() {
    if (this.config.get<string>('NODE_ENV') === 'test' || this.config.get<string>('REDIS_DISABLED') === 'true') {
      return;
    }
    const connection = {
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.config.get<number>('REDIS_PORT', 6379)),
      maxRetriesPerRequest: null,
    };

    try {
      this.queue = new Queue<EmailJobPayload>('neut-notifications', { connection });
      this.orderExpiryQueue = new Queue<{ orderId: string; orderCode: string }>('neut-order-expiry', {
        connection,
      });
      this.worker = new Worker<EmailJobPayload>(
        'neut-notifications',
        async (job: Job<EmailJobPayload>) => this.deliverEmail(job.data),
        { connection },
      );
      this.worker.on('error', (err) => {
        this.logger.warn(`Notifications worker warning: ${err.message}`);
      });
    } catch (err: any) {
      this.logger.warn(`BullMQ notifications init skipped: ${err.message}`);
    }
  }

  async sendOrderConfirmation(params: {
    to: string;
    orderCode: string;
    customerName: string;
    totalAmount: number;
    paymentMethod: string;
  }) {
    const payload: EmailJobPayload = {
      type: 'order-confirmation',
      to: params.to,
      subject: `[NEUT-STUDIO] Xác nhận đơn hàng ${params.orderCode}`,
      html: `
        <div style="font-family:monospace;max-width:600px;margin:0 auto;border:2px solid #000;padding:24px;">
          <h2 style="text-transform:uppercase;margin-top:0;">NEUT-STUDIO // XÁC NHẬN ĐƠN HÀNG</h2>
          <p>Xin chào <strong>${params.customerName}</strong>,</p>
          <p>Đơn hàng <strong>${params.orderCode}</strong> của bạn đã được tiếp nhận thành công.</p>
          <p><strong>Tổng thanh toán:</strong> ${params.totalAmount.toLocaleString('vi-VN')} VND (${params.paymentMethod})</p>
          <p>Cảm ơn bạn đã đồng hành cùng Neut-Studio.</p>
        </div>
      `,
    };
    return this.enqueueOrSend(payload);
  }

  async sendPasswordReset(params: { to: string; fullName: string; resetToken: string }) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetLink = `${frontendUrl}/account?resetToken=${encodeURIComponent(params.resetToken)}`;
    const payload: EmailJobPayload = {
      type: 'password-reset',
      to: params.to,
      subject: '[NEUT-STUDIO] Yêu cầu đặt lại mật khẩu',
      html: `
        <div style="font-family:monospace;max-width:600px;margin:0 auto;border:2px solid #000;padding:24px;">
          <h2 style="text-transform:uppercase;margin-top:0;">NEUT-STUDIO // ĐẶT LẠI MẬT KHẨU</h2>
          <p>Xin chào <strong>${params.fullName}</strong>,</p>
          <p>Mã đặt lại mật khẩu (hết hạn sau 15 phút): <strong>${params.resetToken}</strong></p>
          <p>Hoặc truy cập: <a href="${resetLink}">${resetLink}</a></p>
        </div>
      `,
    };
    return this.enqueueOrSend(payload);
  }

  private async enqueueOrSend(payload: EmailJobPayload) {
    if (this.queue) {
      try {
        await this.queue.add(payload.type, payload, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        });
        return { queued: true };
      } catch (err: any) {
        this.logger.warn(`Queue fallback to direct delivery: ${err.message}`);
      }
    }
    await this.deliverEmail(payload);
    return { queued: false };
  }

  async deliverEmail(payload: EmailJobPayload) {
    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      this.logger.log(`[Email SMTP] Sent ${payload.type} to ${payload.to}`);
      return { mode: 'smtp' as const };
    }

    this.logger.log(`[Email Sandbox] ${payload.type} -> ${payload.to} | Subject: ${payload.subject}`);
    return { mode: 'sandbox' as const };
  }

  async scheduleOrderExpiry(orderId: string, orderCode: string, delayMs = 15 * 60 * 1000) {
    if (!this.orderExpiryQueue) return { scheduled: false };
    try {
      await this.orderExpiryQueue.add(
        'expire-unpaid-order',
        { orderId, orderCode },
        {
          jobId: `expire-${orderId}`,
          delay: delayMs,
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      );
      return { scheduled: true };
    } catch (err: any) {
      this.logger.warn(`Could not schedule expiry for ${orderCode}: ${err.message}`);
      return { scheduled: false };
    }
  }

  async onModuleDestroy() {
    await this.worker?.close().catch(() => {});
    await this.queue?.close().catch(() => {});
    await this.orderExpiryQueue?.close().catch(() => {});
  }
}
