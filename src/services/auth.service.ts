import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { WorkspacesService } from './workspaces.service';
import { GoogleProfile } from '../common/strategies/google.strategy';
import { Theme } from '../enums/theme.enum';
import { ColorMode } from '../enums/color-mode.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
    private readonly jwtService: JwtService,
  ) {}

  async guestLogin() {
    try {
      const user = await this.usersService.createGuest();
      const workspace = await this.workspacesService.createDefaultForUser(user._id, 'Dexter');
      await this.usersService.setDefaultWorkspace(user._id.toString(), workspace._id);

      return this._buildAuthResponse(user, workspace);
    } catch (error) {
      console.log('🚀 ~ AuthService ~ guestLogin ~ error:', error);
      throw new BadRequestException({
        userMessage: 'Guest login failed',
        developerMessage: error?.message,
      });
    }
  }

  async googleLogin(profile: GoogleProfile) {
    try {
      const user = await this.usersService.findOrCreateByGoogleProfile(profile);

      let workspace;
      if (user.defaultWorkspaceId) {
        workspace = await this.workspacesService.getOne(
          user.defaultWorkspaceId.toString(),
          user._id.toString(),
        );
      } else {
        workspace = await this.workspacesService.createDefaultForUser(user._id, 'Dexter');
        await this.usersService.setDefaultWorkspace(user._id.toString(), workspace._id);
      }

      return this._buildAuthResponse(user, workspace);
    } catch (error) {
      console.log('🚀 ~ AuthService ~ googleLogin ~ error:', error);
      throw new BadRequestException({
        userMessage: 'Google login failed',
        developerMessage: error?.message,
      });
    }
  }

  private _generateToken(user: { _id: any; isGuest: boolean; email?: string | null }): string {
    return this.jwtService.sign({
      sub: user._id.toString(),
      isGuest: user.isGuest,
      email: user.email ?? null,
    });
  }

  private _buildAuthResponse(user: any, workspace: any) {
    return {
      accessToken: this._generateToken(user),
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isGuest: user.isGuest,
        preferences: {
          theme: user.theme ?? Theme.LIGHT,
          colorMode: user.colorMode ?? ColorMode.BLACK,
        },
      },
      workspace,
    };
  }
}
