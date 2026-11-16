import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CouponsService } from './coupons.service.js';
import { ValidateCouponDto } from './dto/validate-coupon.dto.js';

@ApiTags('Coupons & Discounts')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kiểm tra tính hợp lệ của mã giảm giá và tính toán số tiền giảm' })
  @ApiResponse({ status: 200, description: 'Mã hợp lệ' })
  @ApiResponse({ status: 400, description: 'Mã không hợp lệ / hết hạn / không đủ điều kiện' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(dto);
  }
}
