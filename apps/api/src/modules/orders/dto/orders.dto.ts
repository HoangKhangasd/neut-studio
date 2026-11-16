import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 'variant-uuid' })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên người nhận' })
  customerName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại nhận hàng' })
  customerPhone: string;

  @ApiProperty({ example: 'customer@gmail.com' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập email' })
  customerEmail: string;

  @ApiProperty({
    example: { province: 'TP. Hồ Chí Minh', district: 'Quận 10', ward: 'Phường 12', street: '561 Sư Vạn Hạnh' },
  })
  @IsNotEmpty()
  shippingAddress: {
    province: string;
    district: string;
    ward: string;
    street: string;
  };

  @ApiProperty({ example: 'COD', enum: ['COD', 'PAYOS', 'VNPAY'] })
  @IsString()
  @IsNotEmpty()
  paymentMethod: 'COD' | 'PAYOS' | 'VNPAY';

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 'NEUT10', required: false })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class AdminOrderQueryDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiProperty({ required: false, example: 'ALL' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, example: 'NEUT-2026' })
  @IsOptional()
  @IsString()
  search?: string;
}
