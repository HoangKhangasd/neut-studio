import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StoresService } from './stores.service.js';
import { PhoneSubscribeDto } from './dto/stores.dto.js';

@ApiTags('Stores & Leads')
@Controller()
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('stores')
  @ApiOperation({ summary: 'Lấy danh sách các chi nhánh cửa hàng thực tế' })
  async getStores() {
    return this.storesService.getStores();
  }

  @Get('stores/inventory')
  @ApiOperation({ summary: 'Kiểm tra cửa hàng còn hàng theo biến thể SKU' })
  async getStoreInventory(@Query('variantId') variantId: string) {
    return this.storesService.getStoreInventory(variantId);
  }

  @Post('leads/subscribe')
  @ApiOperation({ summary: 'Đăng ký SĐT nhận voucher 10% (Join The Movement banner)' })
  async subscribePhone(@Body() dto: PhoneSubscribeDto) {
    return this.storesService.subscribePhone(dto.phone);
  }
}
