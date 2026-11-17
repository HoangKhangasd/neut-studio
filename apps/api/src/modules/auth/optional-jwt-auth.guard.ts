import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    const req = context?.switchToHttp?.()?.getRequest?.();
    const authHeader = req?.headers?.authorization;

    if (!authHeader) {
      return null;
    }

    if (err || !user) {
      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
    }

    return user;
  }
}
