import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service.js';
import {
  ValidateCouponDto,
  AdminCouponQueryDto,
  CreateCouponDto,
  UpdateCouponDto,
} from './dto/validate-coupon.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RateLimit, RateLimitGuard } from '../redis/rate-limit.guard.js';

@ApiTags('Coupons & Discounts')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit(20, 60)
  @ApiOperation({ summary: 'Kiểm tra tính hợp lệ của mã giảm giá và tính toán số tiền giảm' })
  @ApiResponse({ status: 200, description: 'Mã hợp lệ' })
  @ApiResponse({ status: 400, description: 'Mã không hợp lệ / hết hạn / không đủ điều kiện' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(dto);
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60)
  @ApiOperation({ summary: 'Đăng ký số điện thoại nhận mã ưu đãi' })
  async subscribeNewsletter(@Body('phone') phone: string) {
    return this.couponsService.subscribeNewsletter(phone);
  }

  // ===================== ADMIN COUPONS CRUD =====================
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin lấy danh sách mã giảm giá có phân trang' })
  async getAdminCoupons(@Query() query: AdminCouponQueryDto) {
    return this.couponsService.getAdminCoupons(query);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin tạo mã giảm giá mới' })
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.createCoupon(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin cập nhật trạng thái hoặc cấu hình mã giảm giá' })
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.updateCoupon(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin xóa mã giảm giá' })
  async deleteCoupon(@Param('id') id: string) {
    return this.couponsService.deleteCoupon(id);
  }
}
