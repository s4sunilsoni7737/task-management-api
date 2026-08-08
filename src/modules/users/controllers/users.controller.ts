import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/common/interfaces/request-with-user.interface';
import { UsersService } from '../services/users.service';
import { UpdateUserPreferencesDto } from '../dto/update-user-preferences.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.usersService.findById(user.userId);
    return {
      success: true,
      userMessage: 'Profile fetched successfully',
      developerMessage: 'Current user fetched',
      data: result,
    };
  }

  @Patch('me/profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateUserProfileDto) {
    const result = await this.usersService.updateProfile(user.userId, body);
    return {
      success: true,
      userMessage: 'Profile updated successfully',
      developerMessage: 'Profile updated',
      data: result,
    };
  }

  @Patch('me/preferences')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateUserPreferencesDto,
  ) {
    const result = await this.usersService.updatePreferences(user.userId, body);
    return {
      success: true,
      userMessage: 'Preferences updated successfully',
      developerMessage: 'Theme/colorMode preferences updated',
      data: result,
    };
  }
}
