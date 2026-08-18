import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { GoogleAuthGuard } from '../common/guards/google-auth.guard';
import { AuthService } from '../services/auth.service';
import { GoogleProfile } from '../common/strategies/google.strategy';
import { FRONTEND_URL } from '../constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('demo/:role')
  @ApiOperation({
    summary: 'Login as Demo Owner/Member',
    description:
      'Creates an owner or member demo user linked to a shared Demo Workspace, and returns a JWT.',
  })
  async demoLogin(@Req() req: { params: { role: string } }) {
    const role = req.params.role === 'owner' ? 'owner' : 'member';
    const result = await this.authService.demoLogin(role);
    return {
      success: true,
      userMessage: `Signed in as Demo ${role === 'owner' ? 'Owner' : 'Member'}`,
      developerMessage: 'Demo session created',
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
