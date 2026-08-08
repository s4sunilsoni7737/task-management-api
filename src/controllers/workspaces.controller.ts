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
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { WorkspacesService } from 'src/services/workspaces.service';
import { CreateWorkspaceDto } from 'src/dto/create-workspace.dto';
import { UpdateWorkspaceDto } from 'src/dto/update-workspace.dto';
import { AddWorkspaceMemberDto } from 'src/dto/add-workspace-member.dto';

@ApiTags('Workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
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
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
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
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiBody({ type: CreateWorkspaceDto })
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
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'id', description: 'Workspace ID', type: 'string', format: 'mongodb ObjectId' })
  @ApiBody({ type: UpdateWorkspaceDto })
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
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'id', description: 'Workspace ID', type: 'string', format: 'mongodb ObjectId' })
  @ApiBody({ type: AddWorkspaceMemberDto })
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
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
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