import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/services/users.service';
import { WorkspacesService } from 'src/services/workspaces.service';
import { GoogleProfile } from 'src/common/strategies/google.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
    private readonly jwtService: JwtService,
  ) {}

  async guestLogin() {
    const user = await this.usersService.createGuest();
    const workspace = await this.workspacesService.createDefaultForUser(user._id, 'Dexter');
    await this.usersService.setDefaultWorkspace(user._id.toString(), workspace._id);

    return this._buildAuthResponse(user, workspace);
  }

  async googleLogin(profile: GoogleProfile) {
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
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isGuest: user.isGuest,
        theme: user.theme,
        colorMode: user.colorMode,
      },
      workspace,
    };
  }
}
