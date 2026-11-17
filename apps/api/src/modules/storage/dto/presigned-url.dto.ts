import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_UPLOAD_FOLDERS = ['products', 'reviews'] as const;

export type AllowedUploadFolder = (typeof ALLOWED_UPLOAD_FOLDERS)[number];

export class PresignedUrlDto {
  @ApiProperty({ example: 'lookbook-front.jpg' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 'image/jpeg', enum: ALLOWED_IMAGE_MIME_TYPES })
  @IsString()
  @IsIn(ALLOWED_IMAGE_MIME_TYPES, {
    message: 'Chỉ hỗ trợ định dạng ảnh JPEG, PNG hoặc WEBP',
  })
  contentType: string;

  @ApiPropertyOptional({ example: 'reviews', enum: ALLOWED_UPLOAD_FOLDERS })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_UPLOAD_FOLDERS, {
    message: 'Thư mục tải lên không hợp lệ',
  })
  folder?: AllowedUploadFolder;
}
