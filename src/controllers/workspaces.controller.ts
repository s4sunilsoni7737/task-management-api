import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/common/interfaces/request-with-user.interface';
import { WorkspacesService } from 'src/services/workspaces.service';
import { CreateWorkspaceDto } from 'src/dto/create-workspace.dto';
import { UpdateWorkspaceDto } from 'src/dto/update-workspace.dto';
import { AddWorkspaceMemberDto } from 'src/dto/add-workspace-member.dto';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async getAll(@CurrentUser('userId') userId: string) {
    const result = await this.workspacesService.listForUser(userId);
    return {
      success: true,
      userMessage: 'Workspaces fetched successfully',
      developerMessage: 'Workspace list fetched',
      data: result,
    };
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Workspace ID', type: 'string', format: 'mongodb ObjectId' })
  async getOne(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid workspace id');
    const result = await this.workspacesService.getOne(id, userId);
    return {
      success: true,
      userMessage: 'Workspace fetched successfully',
      developerMessage: 'Workspace fetched',
      data: result,
    };
  }

  @Post()
  async create(@Body() body: CreateWorkspaceDto, @CurrentUser('userId') userId: string) {
    const result = await this.workspacesService.create(body, userId);
    return {
      success: true,
      userMessage: 'Workspace created successfully',
      developerMessage: 'Workspace created',
      data: result,
    };
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Workspace ID', type: 'string', format: 'mongodb ObjectId' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateWorkspaceDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid workspace id');
    const result = await this.workspacesService.update(id, body, userId);
    return {
      success: true,
      userMessage: 'Workspace updated successfully',
      developerMessage: 'Workspace updated',
      data: result,
    };
  }

  @Post(':id/members')
  @ApiParam({ name: 'id', description: 'Workspace ID', type: 'string', format: 'mongodb ObjectId' })
  async addMember(
    @Param('id') id: string,
    @Body() body: AddWorkspaceMemberDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid workspace id');
    const result = await this.workspacesService.addMember(id, body.userId, userId);
    return {
      success: true,
      userMessage: 'Member added successfully',
      developerMessage: 'Workspace member added',
      data: result,
    };
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Workspace ID', type: 'string', format: 'mongodb ObjectId' })
  async remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid workspace id');
    await this.workspacesService.remove(id, userId);
    return {
      success: true,
      userMessage: 'Workspace deleted successfully',
      developerMessage: 'Workspace soft-deleted',
      data: {},
    };
  }
}
