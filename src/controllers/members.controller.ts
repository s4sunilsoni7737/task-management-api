import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MembersService } from '../services/members.service';

@ApiTags('Members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  async getAll(@CurrentUser('userId') userId: string) {
    const result = await this.membersService.getAllForUser(userId);
    return {
      success: true,
      userMessage: 'Members fetched successfully',
      developerMessage: 'Workspace members fetched',
      data: result,
    };
  }
}
