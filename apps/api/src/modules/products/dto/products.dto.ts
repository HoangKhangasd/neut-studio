import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class ProductQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collectionSlug?: string;

  @ApiPropertyOptional({ description: 'Phân cách bằng dấu phẩy: S,M,L,XL' })
  @IsOptional()
  @IsString()
  sizes?: string;

  @ApiPropertyOptional({ description: 'Phân cách bằng dấu phẩy: Black,White,Grey' })
  @IsOptional()
  @IsString()
  colors?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ example: 2000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['newest', 'price_asc', 'price_desc', 'featured'] })
  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'featured';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}

export class FitFinderDto {
  @ApiProperty({ example: 172, description: 'Chiều cao (cm)' })
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  heightCm: number;

  @ApiProperty({ example: 65, description: 'Cân nặng (kg)' })
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  weightKg: number;

  @ApiProperty({ example: 'balanced', enum: ['slim', 'balanced', 'full'] })
  @IsString()
  bodyType: 'slim' | 'balanced' | 'full';

  @ApiProperty({ example: 'comfortable', enum: ['tight', 'comfortable', 'oversize'] })
  @IsString()
  fitPreference: 'tight' | 'comfortable' | 'oversize';
}

export class CreateReviewDto {
  @ApiProperty({ example: 'Hoàng Streetwear' })
  @IsString()
  customerName: string;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  rating: number;

  @ApiProperty({ example: 0, description: '-1: Hơi chật, 0: Chuẩn size, 1: Rộng oversize' })
  @Type(() => Number)
  @IsNumber()
  fitScore: number;

  @ApiPropertyOptional({ example: 172 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userHeightCm?: number;

  @ApiPropertyOptional({ example: 65 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userWeightKg?: number;

  @ApiPropertyOptional({ example: 'L' })
  @IsOptional()
  @IsString()
  purchasedSize?: string;

  @ApiProperty({ example: 'Chất vải 250gsm rất dày dặn, form áo đứng chuẩn streetwear.' })
  @IsString()
  comment: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  images?: string[];
}

export class UpdateVariantStockDto {
  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stockQuantity?: number;

  @ApiPropertyOptional({ example: 450000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 390000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salePrice?: number;
}

export class UpdateProductAdminDto {
  @ApiPropertyOptional({ example: 'Áo Thun Streetwear Heavyweight' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 450000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional({ example: ['http://localhost:9000/...'] })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  variants?: Array<{
    id?: string;
    size: string;
    colorName?: string;
    colorHex?: string;
    stockQuantity: number;
    price?: number;
  }>;
}

export class AdminProductQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ example: 'ao-thun' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateProductAdminDto {
  @ApiProperty({ example: 'Áo Thun Neut Basic Monogram' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'ao-thun-neut-basic-monogram' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 450000 })
  @Type(() => Number)
  @IsNumber()
  basePrice: number;

  @ApiPropertyOptional({ example: ['https://images.unsplash.com/...'] })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    example: [
      { size: 'M', colorName: 'Đen', colorHex: '#000000', stockQuantity: 20 },
      { size: 'L', colorName: 'Đen', colorHex: '#000000', stockQuantity: 25 },
    ],
  })
  @IsOptional()
  variants?: Array<{
    size: string;
    colorName: string;
    colorHex?: string;
    stockQuantity: number;
    price?: number;
  }>;
}
