import { Request } from 'express';

/**
 * Shape of `req.user` after JwtGuard has run. Kept intentionally
 * minimal — everything else about the user is fetched via UsersService
 * when needed, keeping the JWT payload small.
 */
export interface AuthenticatedUser {
  userId: string;
  isGuest: boolean;
  email?: string | null;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
