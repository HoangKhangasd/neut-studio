import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateCouponDto {
  @ApiProperty({ example: 'NEUT10' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã giảm giá' })
  code: string;

  @ApiProperty({ example: 450000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Giá trị đơn hàng phải lớn hơn hoặc bằng 0' })
  subtotal: number;
}
