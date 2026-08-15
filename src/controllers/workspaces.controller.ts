

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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../services/cloudinary.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WorkspacesService } from '../services/workspaces.service';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { UpdateWorkspaceDto } from '../dto/update-workspace.dto';
import { AddWorkspaceMemberDto } from '../dto/add-workspace-member.dto';

@ApiTags('Workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatarUrl', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiBody({ type: CreateWorkspaceDto })
  async create(
    @Body() body: CreateWorkspaceDto, 
    @CurrentUser('userId') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      if (!file.buffer) {
        throw new BadRequestException('File buffer is empty. This may be an issue with the serverless environment body parser.');
      }
      try {
        const uploadResult = await this.cloudinaryService.uploadImage(file, 'workspaces');
        body.avatarUrl = uploadResult.secure_url;
      } catch (error: any) {
        throw new BadRequestException(`Cloudinary upload failed: ${error.message}`);
      }
    }
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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatarUrl', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiParam({ name: 'id', description: 'Workspace ID', type: 'string', format: 'mongodb ObjectId' })
  @ApiBody({ type: UpdateWorkspaceDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateWorkspaceDto,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid workspace id');
    if (file) {
      if (!file.buffer) {
        throw new BadRequestException('File buffer is empty. This may be an issue with the serverless environment body parser.');
      }
      try {
        const uploadResult = await this.cloudinaryService.uploadImage(file, 'workspaces');
        body.avatarUrl = uploadResult.secure_url;
      } catch (error: any) {
        throw new BadRequestException(`Cloudinary upload failed: ${error.message}`);
      }
    }
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
