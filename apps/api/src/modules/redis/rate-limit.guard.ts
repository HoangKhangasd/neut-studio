import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from './redis.service.js';

export const RATE_LIMIT_KEY = 'rate_limit_config';

export interface RateLimitConfig {
  limit: number;
  ttlSeconds: number;
}

export const RateLimit = (limit: number, ttlSeconds: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, ttlSeconds } satisfies RateLimitConfig);

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.getAllAndOverride<RateLimitConfig>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!config) return true;

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const ip =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';
    const route = `${req.method}:${req.route?.path || req.url}`;
    const key = `rl:${route}:${ip}`;

    const { count, ttl } = await this.redis.incrWithExpiry(key, config.ttlSeconds);
    if (count > config.limit) {
      if (typeof res?.setHeader === 'function') {
        res.setHeader('Retry-After', String(ttl));
      }
      throw new HttpException(
        `Quá nhiều yêu cầu. Vui lòng thử lại sau ${ttl} giây.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
