import { describe, it, expect, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
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
});
