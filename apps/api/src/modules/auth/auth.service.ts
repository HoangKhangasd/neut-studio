import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import { users } from '../../database/schema/index.js';
import { RedisService } from '../redis/redis.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AdminUserQueryDto,
} from './dto/auth.dto.js';

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const RESET_TTL_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly jwtService: JwtService,
    @Optional() private readonly config?: ConfigService,
    @Optional() private readonly redis?: RedisService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  private getRefreshSecret(): string {
    return (
      this.config?.get<string>('JWT_REFRESH_SECRET') ||
      this.config?.get<string>('JWT_ACCESS_SECRET') ||
      'dev-refresh-secret'
    );
  }

  private async issueTokenPair(userId: string, email: string, role: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email, role });
    const jti = randomUUID();
    const refreshToken = this.jwtService.sign(
      { sub: userId, jti, type: 'refresh' },
      {
        secret: this.getRefreshSecret(),
        expiresIn: (this.config?.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any) || '7d',
      },
    );

    if (this.redis) {
      await this.redis.set(`rt:${jti}`, userId, REFRESH_TTL_SECONDS);
    }

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.db.query.users.findFirst({
      where: and(eq(users.email, dto.email.toLowerCase().trim()), isNull(users.deletedAt)),
    });

    if (existing) {
      throw new ConflictException('Email này đã được đăng ký tài khoản');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const [newUser] = await this.db
      .insert(users)
      .values({
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: 'CUSTOMER',
      })
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
      });

    const tokens = await this.issueTokenPair(newUser.id, newUser.email, newUser.role);
    return { user: newUser, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.email, dto.email.toLowerCase().trim()), isNull(users.deletedAt)),
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);
    const { passwordHash: _, ...safeUser } = user;

    return { user: safeUser, ...tokens };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Thiếu refresh token');
    }

    let payload: { sub: string; jti: string; type?: string };
    try {
      payload = this.jwtService.verify(refreshToken, { secret: this.getRefreshSecret() });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    if (payload.type !== 'refresh' || !payload.jti || !payload.sub) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (this.redis) {
      const storedUserId = await this.redis.get(`rt:${payload.jti}`);
      if (!storedUserId || storedUserId !== payload.sub) {
        throw new UnauthorizedException('Phiên đăng nhập đã bị thu hồi hoặc hết hạn');
      }
      // Rotate refresh token: revoke consumed jti
      await this.redis.del(`rt:${payload.jti}`);
    }

    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, payload.sub), isNull(users.deletedAt)),
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa');
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async logout(refreshToken?: string) {
    if (refreshToken && this.redis) {
      try {
        const payload = this.jwtService.verify(refreshToken, { secret: this.getRefreshSecret() });
        if (payload?.jti) {
          await this.redis.del(`rt:${payload.jti}`);
        }
      } catch {
        // Already expired or invalid; clearing cookie is sufficient
      }
    }
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, userId), isNull(users.deletedAt)),
    });
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.email, dto.email.toLowerCase().trim()), isNull(users.deletedAt)),
    });

    if (user && this.redis) {
      const resetToken = randomBytes(24).toString('hex');
      await this.redis.set(`pwdreset:${resetToken}`, user.id, RESET_TTL_SECONDS);
      await this.notifications?.sendPasswordReset({
        to: user.email,
        fullName: user.fullName,
        resetToken,
      });
    }

    return {
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (!this.redis) {
      throw new BadRequestException('Dịch vụ đặt lại mật khẩu tạm thời không khả dụng');
    }

    const userId = await this.redis.get(`pwdreset:${dto.token.trim()}`);
    if (!userId) {
      throw new BadRequestException('Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    const [updated] = await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning({ id: users.id });

    if (!updated) {
      throw new NotFoundException('Không tìm thấy tài khoản hợp lệ');
    }

    await this.redis.del(`pwdreset:${dto.token.trim()}`);
    return { success: true, message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.' };
  }

  async getProfile(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, userId), isNull(users.deletedAt)),
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  // ===================== ADMIN USERS MANAGEMENT =====================
  async getAdminUsers(query?: AdminUserQueryDto) {
    const page = Math.max(1, Math.floor(Number(query?.page)) || 1);
    const limit = Math.max(1, Math.min(100, Math.floor(Number(query?.limit)) || 10));
    const offset = (page - 1) * limit;

    const conditions: any[] = [isNull(users.deletedAt)];
    if (query?.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(
        or(ilike(users.email, term), ilike(users.fullName, term), ilike(users.phone, term)),
      );
    }
    const whereClause = and(...conditions);

    const [{ count }] = await this.db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(whereClause);

    const total = Number(count);
    const totalPages = Math.ceil(total / limit);

    const rows = await this.db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return { data: rows, total, page, totalPages };
  }

  async updateUserRole(targetUserId: string, role: 'CUSTOMER' | 'ADMIN' | 'STAFF', actorId: string) {
    if (targetUserId === actorId) {
      throw new BadRequestException('Không thể tự thay đổi quyền của chính mình');
    }

    const [updated] = await this.db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(and(eq(users.id, targetUserId), isNull(users.deletedAt)))
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
      });

    if (!updated) throw new NotFoundException('Không tìm thấy người dùng');
    return updated;
  }

  async deleteUserAdmin(targetUserId: string, actorId: string) {
    if (targetUserId === actorId) {
      throw new BadRequestException('Không thể tự xóa tài khoản quản trị đang đăng nhập');
    }

    const [deleted] = await this.db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(users.id, targetUserId), isNull(users.deletedAt)))
      .returning({ id: users.id });

    if (!deleted) throw new NotFoundException('Không tìm thấy người dùng để xóa');
    return { success: true, id: targetUserId };
  }
}
