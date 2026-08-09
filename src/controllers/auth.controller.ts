import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { GoogleAuthGuard } from 'src/common/guards/google-auth.guard';
import { AuthService } from 'src/services/auth.service';
import { GoogleProfile } from 'src/common/strategies/google.strategy';
import { FRONTEND_URL } from 'src/constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('guest')
  @ApiOperation({
    summary: 'Continue as Guest',
    description:
      'Creates an anonymous guest user and a default workspace, and returns a JWT — no fields required. Matches the "Continue as Guest" primary CTA on the login screen.',
  })
  async guestLogin() {
    const result = await this.authService.guestLogin();
    return {
      success: true,
      userMessage: 'Signed in as guest',
      developerMessage: 'Guest session created',
      data: result,
    };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Login with Google (step 1 — redirect to Google)',
    description:
      'Redirects the browser to the Google OAuth consent screen. Requires GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET to be configured.',
  })
  async googleAuth() {
    // Guard handles the redirect to Google; this handler body never runs.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Login with Google (step 2 — OAuth callback)',
    description:
      'Google redirects here after consent. Issues a JWT for the authenticated user and redirects to FRONTEND_URL with the token as a query parameter.',
  })
  async googleCallback(@Req() req: { user: GoogleProfile }, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    return res.redirect(`${FRONTEND_URL}/auth/callback?token=${result.accessToken}`);
  }
}
