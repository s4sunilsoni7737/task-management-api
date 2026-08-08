import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Kicks off / completes the Google OAuth2 handshake via passport-google-oauth20.
 * Used on GET /auth/google and GET /auth/google/callback.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
