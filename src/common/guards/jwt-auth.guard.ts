import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * ✅ PATTERN: Verifies the JWT (guest or Google-authenticated) and
 * populates `req.user`. Chained first on every protected route, the same
 * way `JwtAdminGuard` is chained before `PermissionGuard` in the admin
 * portal blueprint — this app has no RBAC layer, so there is no
 * PermissionGuard to follow it.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      const reason =
        info?.name === 'TokenExpiredError'
          ? 'Session expired, please log in again'
          : 'Invalid or missing authentication token';
      throw err || new UnauthorizedException(reason);
    }
    return user;
  }

  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }
}
