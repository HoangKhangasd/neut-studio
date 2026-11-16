import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import {
  ProductQueryDto,
  FitFinderDto,
  CreateReviewDto,
  UpdateVariantStockDto,
  UpdateProductAdminDto,
  CreateProductAdminDto,
} from './dto/products.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@ApiTags('Catalog & Products')
@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ===================== ADMIN ENDPOINTS =====================
  @Get('products/admin/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin lấy toàn bộ sản phẩm và tồn kho biến thể' })
  async getAdminProducts() {
    return this.productsService.getAdminProducts();
  }

  @Post('products/admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin tạo sản phẩm mới kèm biến thể và hình ảnh' })
  async createProductAdmin(@Body() dto: CreateProductAdminDto) {
    return this.productsService.createProductAdmin(dto);
  }

  @Patch('products/admin/variants/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin cập nhật số lượng tồn kho và giá biến thể' })
  async updateVariantInventory(@Param('id') id: string, @Body() dto: UpdateVariantStockDto) {
    return this.productsService.updateVariantInventory(id, dto);
  }

  @Patch('products/admin/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin cập nhật thông tin sản phẩm (ẩn/hiện, nổi bật, giá, biến thể, hình ảnh)' })
  async updateProductAdmin(@Param('id') id: string, @Body() dto: UpdateProductAdminDto) {
    return this.productsService.updateProductAdmin(id, dto);
  }

  @Delete('products/admin/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin xóa sản phẩm khỏi hệ thống' })
  async deleteProductAdmin(@Param('id') id: string) {
    return this.productsService.deleteProductAdmin(id);
  }

  // ===================== PUBLIC ENDPOINTS =====================

  @Get('products/:slug/reviews')
  @ApiOperation({ summary: 'Lấy danh sách đánh giá kèm thống kê độ vừa vặn thực tế theo sản phẩm' })
  async getProductReviews(@Param('slug') slug: string) {
    return this.productsService.getProductReviews(slug);
  }

  @Post('products/:slug/reviews')
  @ApiOperation({ summary: 'Khách hàng viết review kèm đánh giá form, số đo thực tế và ảnh feedback MinIO' })
  async createProductReview(@Param('slug') slug: string, @Body() dto: CreateReviewDto) {
    return this.productsService.createProductReview(slug, dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lấy toàn bộ danh mục phân cấp thời trang' })
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Get('collections')
  @ApiOperation({ summary: 'Lấy danh sách các bộ sưu tập (Collab & DICO)' })
  async getCollections() {
    return this.productsService.getCollections();
  }

  @Get('collections/:slug')
  @ApiOperation({ summary: 'Lấy chi tiết bộ sưu tập theo slug' })
  async getCollectionBySlug(@Param('slug') slug: string) {
    return this.productsService.getCollectionBySlug(slug);
  }

  @Get('products')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm có bộ lọc (Faceted filter & Quick Size Bar)' })
  async getProducts(@Query() query: ProductQueryDto) {
    return this.productsService.getProducts(query);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm và các biến thể theo slug' })
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.getProductBySlug(slug);
  }

  @Post('products/fit-finder')
  @ApiOperation({ summary: 'Thuật toán gợi ý chọn size thông minh (Smart Fit Finder)' })
  async calculateFit(@Body() dto: FitFinderDto) {
    return this.productsService.calculateFit(dto);
  }
}
