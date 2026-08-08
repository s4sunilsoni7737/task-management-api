export interface JwtPayload {
  sub: string; // userId
  isGuest: boolean;
  email?: string | null;
  iat?: number;
  exp?: number;
}
