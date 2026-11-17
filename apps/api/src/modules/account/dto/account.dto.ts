import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertAddressDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ example: 'Quận 10' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 'Phường 13' })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({ example: '561 Sư Vạn Hạnh' })
  @IsString()
  @IsNotEmpty()
  streetAddress: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CartSyncItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class SyncCartDto {
  @ApiProperty({ type: [CartSyncItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartSyncItemDto)
  items: CartSyncItemDto[];
}
