import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null;
  private readonly memoryFallback = new Map<string, { value: string; expiresAt: number }>();

  constructor(config: ConfigService) {
    const disabled = config.get<string>('REDIS_DISABLED') === 'true' || config.get<string>('NODE_ENV') === 'test';
    if (disabled) {
      this.client = null;
      return;
    }

    const host = config.get<string>('REDIS_HOST', 'localhost');
    const port = Number(config.get<number>('REDIS_PORT', 6379));

    this.client = new Redis({
      host,
      port,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis connection warning: ${err.message}`);
    });

    this.client.connect().catch((err) => {
      this.logger.warn(`Redis initial connect deferred (using memory fallback): ${err.message}`);
    });
  }

  getConnectionOptions(config: ConfigService) {
    return {
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(config.get<number>('REDIS_PORT', 6379)),
    };
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.client.status === 'ready') {
      try {
        return await this.client.get(key);
      } catch {
        // fall through to memory fallback
      }
    }
    const entry = this.memoryFallback.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryFallback.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      try {
        await this.client.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        // fall through
      }
    }
    this.memoryFallback.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      try {
        await this.client.del(key);
        return;
      } catch {
        // fall through
      }
    }
    this.memoryFallback.delete(key);
  }

  async incrWithExpiry(key: string, ttlSeconds: number): Promise<{ count: number; ttl: number }> {
    if (this.client && this.client.status === 'ready') {
      try {
        const count = await this.client.incr(key);
        if (count === 1) {
          await this.client.expire(key, ttlSeconds);
          return { count, ttl: ttlSeconds };
        }
        const ttl = await this.client.ttl(key);
        return { count, ttl: ttl > 0 ? ttl : ttlSeconds };
      } catch {
        // fall through
      }
    }

    const now = Date.now();
    const existing = this.memoryFallback.get(key);
    if (!existing || now > existing.expiresAt) {
      this.memoryFallback.set(key, { value: '1', expiresAt: now + ttlSeconds * 1000 });
      return { count: 1, ttl: ttlSeconds };
    }
    const next = Number(existing.value) + 1;
    existing.value = String(next);
    return { count: next, ttl: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)) };
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}
