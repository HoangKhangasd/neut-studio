import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service.js';
import { SyncCartDto, UpsertAddressDto } from './dto/account.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Account (Cart Sync, Addresses & Wishlist)')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // ===================== ADDRESSES =====================
  @Get('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy sổ địa chỉ giao hàng của người dùng' })
  async getAddresses(@CurrentUser('id') userId: string) {
    return this.accountService.getAddresses(userId);
  }

  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm địa chỉ giao hàng mới' })
  async createAddress(@CurrentUser('id') userId: string, @Body() dto: UpsertAddressDto) {
    return this.accountService.createAddress(userId, dto);
  }

  @Patch('addresses/:id/default')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đặt địa chỉ giao hàng mặc định' })
  async setDefaultAddress(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.accountService.setDefaultAddress(userId, id);
  }

  @Delete('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa địa chỉ giao hàng' })
  async deleteAddress(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.accountService.deleteAddress(userId, id);
  }

  // ===================== WISHLIST =====================
  @Get('wishlist')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm yêu thích' })
  async getWishlist(@CurrentUser('id') userId: string) {
    return this.accountService.getWishlist(userId);
  }

  @Post('wishlist/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm sản phẩm vào danh sách yêu thích' })
  async addToWishlist(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.accountService.addToWishlist(userId, productId);
  }

  @Delete('wishlist/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gỡ sản phẩm khỏi danh sách yêu thích' })
  async removeFromWishlist(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.accountService.removeFromWishlist(userId, productId);
  }

  // ===================== CART SYNC & LIVE VALIDATION =====================
  @Post('cart/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kiểm tra và đồng bộ lại giá bán + tồn kho thực tế từ DB cho giỏ hàng' })
  async validateCart(@Body() dto: SyncCartDto) {
    return this.accountService.validateCartItems(dto.items);
  }

  @Get('cart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy giỏ hàng đã đồng bộ trên máy chủ' })
  async getServerCart(@CurrentUser('id') userId: string) {
    return this.accountService.getServerCart(userId);
  }

  @Put('cart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lưu đồng bộ giỏ hàng lên máy chủ kèm kiểm tra tồn kho thực tế' })
  async saveServerCart(@CurrentUser('id') userId: string, @Body() dto: SyncCartDto) {
    return this.accountService.saveServerCart(userId, dto.items);
  }
}
