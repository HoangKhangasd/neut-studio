import { Controller, Post, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService } from './storage.service.js';
import { PresignedUrlDto, AllowedUploadFolder } from './dto/presigned-url.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sinh URL Presigned để tải ảnh trực tiếp từ trình duyệt lên MinIO' })
  async getPresignedUrl(
    @Body() dto: PresignedUrlDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const isAdmin = user?.role === 'ADMIN';
    const targetFolder: AllowedUploadFolder = dto.folder ?? (isAdmin ? 'products' : 'reviews');

    if (targetFolder === 'products' && !isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới được tải ảnh sản phẩm');
    }

    return this.storageService.getPresignedPutUrl(dto.fileName, dto.contentType, targetFolder);
  }
}
