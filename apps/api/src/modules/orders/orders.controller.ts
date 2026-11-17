import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto, AdminOrderQueryDto } from './dto/orders.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Orders & Checkout')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Tạo đơn hàng mới (Trừ kho nguyên tử chống overselling)' })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.ordersService.createOrder(dto, userId);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy lịch sử đơn hàng của khách hàng đang đăng nhập' })
  async getMyOrders(@CurrentUser('id') userId: string) {
    return this.ordersService.getMyOrders(userId);
  }

  @Get('track/:orderCode')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Tra cứu hành trình đơn hàng theo mã đơn và SĐT khách hàng' })
  async trackOrder(
    @Param('orderCode') orderCode: string,
    @Query('phone') phone?: string,
    @CurrentUser() user?: { id: string; role: string } | null,
  ) {
    return this.ordersService.trackOrder(orderCode, phone, user ?? undefined);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng cho Admin kèm phân trang, tìm kiếm và chi tiết món' })
  async getAdminOrders(@Query() query: AdminOrderQueryDto) {
    return this.ordersService.getAdminOrders(query);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin cập nhật trạng thái đơn hàng (CONFIRMED, SHIPPING, COMPLETED)' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateOrderStatus(id, status);
  }
}
