import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async demoLogin(role: 'owner' | 'member') {
    try {
      const user = await this.usersService.getOrCreateDemoUser(role);

      let workspace;
      if (role === 'owner') {
        workspace = await this.workspacesService.getOne(
          user.workspaceId?.toString() ?? '',
          user._id.toString(),
        ).catch(() => null);

        if (!workspace) {
          workspace = await this.workspacesService.createDefaultForUser(user._id, 'Demo Workspace');
          await this.usersService.setWorkspace(user._id.toString(), workspace._id);
        }
      } else {
        const owner = await this.usersService.getOrCreateDemoUser('owner');
        workspace = await this.workspacesService.getOne(
          owner.workspaceId?.toString() ?? '',
          owner._id.toString(),
        ).catch(() => null);
        
        if (!workspace) {
          workspace = await this.workspacesService.createDefaultForUser(owner._id, 'Demo Workspace');
          await this.usersService.setWorkspace(owner._id.toString(), workspace._id);
        }

        if (!workspace.memberIds.some(id => id.toString() === user._id.toString())) {
          await this.workspacesService.addMember(workspace._id.toString(), user._id.toString(), owner._id.toString());
        }
        if (user.workspaceId?.toString() !== workspace._id.toString()) {
          await this.usersService.setWorkspace(user._id.toString(), workspace._id);
        }
      }

      return this._buildAuthResponse(user, workspace);
    } catch (error) {
      console.log('🚀 ~ AuthService ~ demoLogin ~ error:', error);
      throw new BadRequestException({
        userMessage: 'Demo login failed',
        developerMessage: error?.message,
      });
    }
  }

  async googleLogin(profile: GoogleProfile) {
    try {
      const user = await this.usersService.findOrCreateByGoogleProfile(profile);

      let workspace: any = null;
      if (user.workspaceId) {
        try {
          workspace = await this.workspacesService.getOne(
            user.workspaceId.toString(),
            user._id.toString(),
          );
        } catch (error) {
          // Leave workspace null so onboarding triggers
        }
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

  async onboarding(userId: string, role: 'owner' | 'member') {
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      let workspace;
      if (role === 'owner') {
        workspace = await this.workspacesService.createDefaultForUser(user._id, 'Dexter');
        await this.usersService.setWorkspace(user._id.toString(), workspace._id);
      } else {
        const owner = await this.usersService.getOrCreateDemoUser('owner');
        workspace = await this.workspacesService.getOne(
          owner.workspaceId?.toString() ?? '',
          owner._id.toString(),
        ).catch(() => null);
        
        if (!workspace) {
          workspace = await this.workspacesService.createDefaultForUser(owner._id, 'Demo Workspace');
          await this.usersService.setWorkspace(owner._id.toString(), workspace._id);
        }

        if (!workspace.memberIds.some(id => id.toString() === user._id.toString())) {
          await this.workspacesService.addMember(workspace._id.toString(), user._id.toString(), owner._id.toString());
        }
        await this.usersService.setWorkspace(user._id.toString(), workspace._id);
      }

      // Re-fetch the user to get updated workspaceId
      const updatedUser = await this.usersService.findById(userId);
      return this._buildAuthResponse(updatedUser, workspace);
    } catch (error) {
      console.log('🚀 ~ AuthService ~ onboarding ~ error:', error);
      throw new BadRequestException({
        userMessage: 'Onboarding failed',
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
