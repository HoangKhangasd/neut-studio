import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { ALLOWED_IMAGE_MIME_TYPES, ALLOWED_UPLOAD_FOLDERS } from './dto/presigned-url.dto.js';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketProducts: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    const endpoint = `http://${this.config.get('MINIO_ENDPOINT', 'localhost')}:${this.config.get('MINIO_PORT', 9000)}`;
    this.bucketProducts = this.config.get('MINIO_BUCKET_PRODUCTS', 'products');
    this.publicUrl = this.config.get('MINIO_PUBLIC_URL', 'http://localhost:9000');

    const accessKeyId = isProd
      ? this.config.getOrThrow<string>('MINIO_ROOT_USER')
      : this.config.get<string>('MINIO_ROOT_USER', 'minioadmin');
    const secretAccessKey = isProd
      ? this.config.getOrThrow<string>('MINIO_ROOT_PASSWORD')
      : this.config.get<string>('MINIO_ROOT_PASSWORD', 'minioadmin');

    this.s3Client = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      try {
        await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketProducts }));
      } catch {
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketProducts }));
      }

      // Ensure anonymous read is allowed for public asset loading
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketProducts}/*`],
          },
        ],
      });
      await this.s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucketProducts,
          Policy: policy,
        }),
      );
      this.logger.log(`[✓] MinIO bucket '${this.bucketProducts}' đã sẵn sàng và thiết lập Public Read.`);
    } catch (err: any) {
      this.logger.warn(`MinIO auto-policy check: ${err.message}`);
    }
  }

  async getPresignedPutUrl(fileName: string, contentType: string, folder = 'reviews') {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(contentType as any)) {
      throw new BadRequestException('Chỉ hỗ trợ định dạng ảnh JPEG, PNG hoặc WEBP');
    }
    if (!ALLOWED_UPLOAD_FOLDERS.includes(folder as any)) {
      throw new BadRequestException('Thư mục tải lên không hợp lệ');
    }

    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketProducts,
      Key: key,
      ContentType: contentType,
    });

    // 5 minutes expiry
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
    const viewUrl = `${this.publicUrl}/${this.bucketProducts}/${key}`;

    return {
      uploadUrl,
      key,
      publicUrl: viewUrl,
    };
  }

  async deleteFile(key: string, bucket = this.bucketProducts) {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Lỗi xóa file MinIO (${key}): ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
