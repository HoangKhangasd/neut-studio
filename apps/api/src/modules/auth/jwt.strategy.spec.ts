import { describe, it, expect, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { PgDialect } from 'drizzle-orm/pg-core';
import { JwtStrategy } from './jwt.strategy.js';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard.js';

describe('JwtStrategy.validate', () => {
  const mockConfig = { getOrThrow: () => 'test-secret' } as any;

  it('rejects token when user is missing or soft-deleted in DB', async () => {
    const dialect = new PgDialect();
    const findFirst = vi.fn().mockResolvedValue(null);
    const db = { query: { users: { findFirst } } };
    const strategy = new JwtStrategy(mockConfig, db);

    await expect(
      strategy.validate({ sub: 'u-deleted', email: 'a@b.com', role: 'ADMIN' }),
    ).rejects.toThrow(UnauthorizedException);

    const query = dialect.sqlToQuery(findFirst.mock.calls[0][0].where);
    expect(query.sql).toContain('"deleted_at" is null');
  });

  it('returns live DB role rather than stale JWT payload role', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: 'u-1',
      email: 'demoted@neut.studio',
      role: 'CUSTOMER',
    });
    const db = { query: { users: { findFirst } } };
    const strategy = new JwtStrategy(mockConfig, db);

    const res = await strategy.validate({
      sub: 'u-1',
      email: 'demoted@neut.studio',
      role: 'ADMIN',
    });

    expect(res).toEqual({ id: 'u-1', email: 'demoted@neut.studio', role: 'CUSTOMER' });
  });
});

describe('OptionalJwtAuthGuard', () => {
  const makeContext = (authHeader?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: authHeader ? { authorization: authHeader } : {},
        }),
      }),
    }) as any;

  it('returns null for anonymous guest when Authorization header is absent', () => {
    const guard = new OptionalJwtAuthGuard();
    expect(guard.handleRequest(null, false, null, makeContext())).toBeNull();
  });

  it('returns user when JWT is valid', () => {
    const guard = new OptionalJwtAuthGuard();
    const user = { id: 'u-1', email: 'a@b.com', role: 'CUSTOMER' };
    expect(guard.handleRequest(null, user, null, makeContext('Bearer valid'))).toEqual(user);
  });

  it('throws UnauthorizedException when Authorization header is present but invalid/expired', () => {
    const guard = new OptionalJwtAuthGuard();
    expect(() =>
      guard.handleRequest(null, false, new Error('jwt expired'), makeContext('Bearer expired')),
    ).toThrow(UnauthorizedException);
  });
});
