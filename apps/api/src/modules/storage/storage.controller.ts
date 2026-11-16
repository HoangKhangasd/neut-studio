import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StorageService } from './storage.service.js';
import { PresignedUrlDto } from './dto/presigned-url.dto.js';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Sinh URL Presigned để tải ảnh trực tiếp từ trình duyệt lên MinIO' })
  async getPresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.storageService.getPresignedPutUrl(dto.fileName, dto.contentType);
  }
}
