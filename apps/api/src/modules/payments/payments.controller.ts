import { Body, Controller, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import type { PayosWebhookPayload } from './payments.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Payments & Webhooks')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook/payos')
  @ApiOperation({ summary: 'Webhook đối soát thanh toán PayOS/VietQR kèm xác thực chữ ký HMAC-SHA256' })
  async payosWebhook(
    @Body() payload: PayosWebhookPayload,
    @Headers('x-payos-signature') headerSignature?: string,
  ) {
    return this.paymentsService.handlePayosWebhook(payload, headerSignature);
  }

  @Post('sandbox/confirm/:orderCode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Giả lập xác nhận thanh toán PayOS (chỉ khả dụng ngoài môi trường production)' })
  async sandboxConfirm(@Param('orderCode') orderCode: string) {
    return this.paymentsService.sandboxConfirmOrder(orderCode);
  }
}
