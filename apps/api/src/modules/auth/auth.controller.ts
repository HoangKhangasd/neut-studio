import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AdminUserQueryDto,
  UpdateUserRoleDto,
} from './dto/auth.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { Roles } from './decorators/roles.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { RateLimit, RateLimitGuard } from '../redis/rate-limit.guard.js';

const REFRESH_COOKIE_NAME = 'neut_refresh_token';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      path: '/api/auth',
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth',
    });
  }

  @Post('register')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60)
  @ApiOperation({ summary: 'Đăng ký tài khoản khách hàng mới' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.register(dto);
    this.setRefreshCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60)
  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.login(dto);
    this.setRefreshCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới Access Token bằng HttpOnly Refresh Cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    const { user, accessToken, refreshToken } = await this.authService.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất và thu hồi Refresh Token trên Redis' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    await this.authService.logout(token);
    this.clearRefreshCookie(res);
    return { success: true };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu tài khoản đang đăng nhập' })
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('forgot-password')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60)
  @ApiOperation({ summary: 'Gửi yêu cầu đặt lại mật khẩu qua email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60)
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng mã xác thực' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  // ===================== ADMIN USERS =====================
  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin lấy danh sách người dùng có phân trang' })
  async getAdminUsers(@Query() query: AdminUserQueryDto) {
    return this.authService.getAdminUsers(query);
  }

  @Patch('admin/users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin cập nhật vai trò người dùng' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.authService.updateUserRole(id, dto.role, actorId);
  }

  @Delete('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin xóa mềm tài khoản người dùng' })
  async deleteUserAdmin(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.authService.deleteUserAdmin(id, actorId);
  }
}
