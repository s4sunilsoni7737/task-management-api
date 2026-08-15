import { Body, Controller, Get, Patch, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../services/cloudinary.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/request-with-user.interface';
import { UsersService } from '../services/users.service';
import { UpdateUserPreferencesDto } from '../dto/update-user-preferences.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
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
  @UseGuards(JwtGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatarUrl', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiBody({ type: UpdateUserProfileDto })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser, 
    @Body() body: UpdateUserProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      if (!file.buffer) {
        throw new BadRequestException('File buffer is empty. This may be an issue with the serverless environment body parser.');
      }
      try {
        const uploadResult = await this.cloudinaryService.uploadImage(file, 'avatars');
        body.avatarUrl = uploadResult.secure_url;
      } catch (error: any) {
        throw new BadRequestException(`Cloudinary upload failed: ${error.message}`);
      }
    }

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
  @UseGuards(JwtGuard)
  @ApiBody({ type: UpdateUserPreferencesDto })
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
