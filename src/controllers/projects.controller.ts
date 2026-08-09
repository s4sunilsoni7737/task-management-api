import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProjectsService } from '../services/projects.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectListQueryDto } from '../dto/project-list-query.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  async getAll(@Query() query: ProjectListQueryDto, @CurrentUser('userId') userId: string) {
    const result = await this.projectsService.getAll(query, userId);
    return {
      success: true,
      userMessage: 'Projects fetched successfully',
      developerMessage: 'Project list fetched',
      data: result,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'id', description: 'Project ID', type: 'string', format: 'mongodb ObjectId' })
  async getOne(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid project id');
    const result = await this.projectsService.getOne(id, userId);
    return {
      success: true,
      userMessage: 'Project fetched successfully',
      developerMessage: 'Project detail fetched',
      data: result,
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiBody({ type: CreateProjectDto })
  async create(@Body() body: CreateProjectDto, @CurrentUser('userId') userId: string) {
    const result = await this.projectsService.create(body, userId);
    return {
      success: true,
      userMessage: 'Project created successfully',
      developerMessage: 'Project created',
      data: result,
    };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'id', description: 'Project ID', type: 'string', format: 'mongodb ObjectId' })
  @ApiBody({ type: UpdateProjectDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProjectDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid project id');
    const result = await this.projectsService.update(id, body, userId);
    return {
      success: true,
      userMessage: 'Project updated successfully',
      developerMessage: 'Project updated',
      data: result,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'id', description: 'Project ID', type: 'string', format: 'mongodb ObjectId' })
  async remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid project id');
    await this.projectsService.remove(id, userId);
    return {
      success: true,
      userMessage: 'Project deleted successfully',
      developerMessage: 'Project soft-deleted',
      data: {},
    };
  }
}