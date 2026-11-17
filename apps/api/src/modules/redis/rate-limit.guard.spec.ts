import { describe, it, expect, vi } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard.js';

describe('RateLimitGuard', () => {
  const makeContext = (ip = '127.0.0.1') => {
    const headers: Record<string, string> = {};
    return {
      headers,
      ctx: {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ method: 'POST', route: { path: '/auth/login' }, ip, headers: {} }),
          getResponse: () => ({
            setHeader: (k: string, v: string) => {
              headers[k] = v;
            },
          }),
        }),
      } as any,
    };
  };

  it('allows requests up to limit and throws 429 with Retry-After when exceeded', async () => {
    let count = 0;
    const redis = {
      incrWithExpiry: vi.fn(async () => ({ count: ++count, ttl: 45 })),
    } as any;
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue({ limit: 2, ttlSeconds: 60 }),
    } as any;

    const guard = new RateLimitGuard(reflector, redis);
    const { ctx, headers } = makeContext();

    expect(await guard.canActivate(ctx)).toBe(true);
    expect(await guard.canActivate(ctx)).toBe(true);

    try {
      await guard.canActivate(ctx);
      expect.unreachable('Should have thrown 429');
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(headers['Retry-After']).toBe('45');
    }
  });
});
