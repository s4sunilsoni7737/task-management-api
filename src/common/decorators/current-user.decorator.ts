import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser, RequestWithUser } from '../interfaces/request-with-user.interface';

/**
 * ✅ PATTERN: pulls `req.user` (populated by JwtGuard) straight into a
 * controller method parameter — `@CurrentUser() user: AuthenticatedUser`.
 * Pass a key to grab a single field: `@CurrentUser('userId') userId: string`.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
