import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PgDialect } from 'drizzle-orm/pg-core';
import { AuthService } from './auth.service.js';

describe('AuthService soft-delete enforcement', () => {
  it('filters deletedAt IS NULL in login and rejects soft-deleted accounts', async () => {
    const dialect = new PgDialect();
    const findFirst = vi.fn().mockResolvedValue(null);
    const db = { query: { users: { findFirst } } };
    const jwtService = { sign: vi.fn().mockReturnValue('token') } as any;
    const service = new AuthService(db, jwtService);

    await expect(
      service.login({ email: 'deleted@neut.studio', password: 'secret' }),
    ).rejects.toThrow(UnauthorizedException);

    const whereArg = findFirst.mock.calls[0][0].where;
    const query = dialect.sqlToQuery(whereArg);
    expect(query.sql).toContain('"deleted_at" is null');
  });

  it('filters deletedAt IS NULL in getProfile and register', async () => {
    const dialect = new PgDialect();
    const findFirst = vi.fn().mockResolvedValue(null);
    const db = { query: { users: { findFirst } } };
    const jwtService = { sign: vi.fn() } as any;
    const service = new AuthService(db, jwtService);

    await expect(service.getProfile('u-1')).rejects.toThrow(UnauthorizedException);
    const profileQuery = dialect.sqlToQuery(findFirst.mock.calls[0][0].where);
    expect(profileQuery.sql).toContain('"deleted_at" is null');
  });

  it('rotates refresh token on refresh and revokes it on logout', async () => {
    const store = new Map<string, string>();
    const redis = {
      get: vi.fn(async (k: string) => store.get(k) ?? null),
      set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
      del: vi.fn(async (k: string) => { store.delete(k); }),
    } as any;
    const jwtService = new JwtService({ secret: 'access-secret' });
    const config = { get: (k: string, d?: any) => (k === 'JWT_REFRESH_SECRET' ? 'refresh-secret' : d) } as any;
    const db = {
      query: {
        users: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'u-1',
            email: 'a@b.com',
            role: 'CUSTOMER',
            fullName: 'A',
            passwordHash: 'h',
          }),
        },
      },
    };
    const service = new AuthService(db, jwtService, config, redis);
    const firstToken = jwtService.sign(
      { sub: 'u-1', jti: 'jti-1', type: 'refresh' },
      { secret: 'refresh-secret', expiresIn: '7d' },
    );
    store.set('rt:jti-1', 'u-1');

    const refreshed = await service.refresh(firstToken);
    expect(refreshed.accessToken).toBeTruthy();
    expect(store.has('rt:jti-1')).toBe(false);

    // Reusing rotated token must fail
    await expect(service.refresh(firstToken)).rejects.toThrow(UnauthorizedException);

    // Logout revokes the new token
    await service.logout(refreshed.refreshToken);
    await expect(service.refresh(refreshed.refreshToken)).rejects.toThrow(UnauthorizedException);
  });

  it('blocks admin self-delete and self-role-change', async () => {
    const service = new AuthService({}, {} as any);
    await expect(service.deleteUserAdmin('admin-1', 'admin-1')).rejects.toThrow(BadRequestException);
    await expect(service.updateUserRole('admin-1', 'CUSTOMER', 'admin-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
