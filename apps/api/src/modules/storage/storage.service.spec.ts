import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import { StorageController } from './storage.controller.js';

function createConfig(overrides: Record<string, any> = {}) {
  return {
    get: (key: string, fallback?: any) => (key in overrides ? overrides[key] : fallback),
    getOrThrow: (key: string) => {
      if (key in overrides && overrides[key] !== undefined) return overrides[key];
      throw new Error(`Missing env ${key}`);
    },
  } as any;
}

describe('StorageService upload hardening', () => {
  it('rejects disallowed MIME types such as text/html and image/svg+xml', async () => {
    const service = new StorageService(createConfig());

    await expect(
      service.getPresignedPutUrl('xss.html', 'text/html', 'reviews'),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.getPresignedPutUrl('icon.svg', 'image/svg+xml', 'products'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects disallowed or traversal folder names', async () => {
    const service = new StorageService(createConfig());

    await expect(
      service.getPresignedPutUrl('photo.jpg', 'image/jpeg', '../etc'),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.getPresignedPutUrl('photo.jpg', 'image/jpeg', 'avatars'),
    ).rejects.toThrow(BadRequestException);
  });

  it('requires explicit MinIO credentials when NODE_ENV is production', () => {
    expect(() => new StorageService(createConfig({ NODE_ENV: 'production' }))).toThrow(
      /MINIO_ROOT_USER/,
    );
  });
});

describe('StorageController role-based folder authorization', () => {
  it('blocks non-ADMIN user from uploading into products folder', async () => {
    const storageService = { getPresignedPutUrl: vi.fn() } as any;
    const controller = new StorageController(storageService);

    await expect(
      (controller as any).getPresignedUrl(
        { fileName: 'tee.jpg', contentType: 'image/jpeg', folder: 'products' },
        { id: 'u-1', role: 'CUSTOMER' },
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(storageService.getPresignedPutUrl).not.toHaveBeenCalled();
  });

  it('defaults CUSTOMER uploads to reviews and ADMIN uploads to products', async () => {
    const storageService = {
      getPresignedPutUrl: vi.fn().mockResolvedValue({ uploadUrl: 'u', key: 'k', publicUrl: 'p' }),
    } as any;
    const controller = new StorageController(storageService);

    await (controller as any).getPresignedUrl(
      { fileName: 'rev.png', contentType: 'image/png' },
      { id: 'u-1', role: 'CUSTOMER' },
    );
    expect(storageService.getPresignedPutUrl).toHaveBeenLastCalledWith(
      'rev.png',
      'image/png',
      'reviews',
    );

    await (controller as any).getPresignedUrl(
      { fileName: 'prod.webp', contentType: 'image/webp' },
      { id: 'u-2', role: 'ADMIN' },
    );
    expect(storageService.getPresignedPutUrl).toHaveBeenLastCalledWith(
      'prod.webp',
      'image/webp',
      'products',
    );
  });
});
