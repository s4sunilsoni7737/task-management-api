import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProjectCollectionName, ProjectEntity } from 'src/entities/project.entity';
import { CreateProjectDto } from 'src/dto/create-project.dto';
import { UpdateProjectDto } from 'src/dto/update-project.dto';
import { ProjectListQueryDto } from 'src/dto/project-list-query.dto';
import { WorkspacesService } from 'src/services/workspaces.service';
import { escapeRegex } from 'src/common/utils/search.util';
import { buildPagination, toPaginatedResult } from 'src/common/utils/pagination.util';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(ProjectCollectionName) private readonly projectModel: Model<ProjectEntity>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getAll(query: ProjectListQueryDto, userId: string) {
    try {
      await this.workspacesService.assertUserIsMember(query.workspaceId, userId);

      const { workspaceId, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
      const { shouldPaginate, skip, page, limit } = buildPagination(query.page, query.limit);

      const filter: any = { workspaceId, isDeleted: false };
      if (search) {
        const searchRegex = escapeRegex(search);
        filter.name = { $regex: searchRegex, $options: 'i' };
      }

      const sortCondition: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      let mongooseQuery = this.projectModel.find(filter).sort(sortCondition).select('-__v');
      if (shouldPaginate) mongooseQuery = mongooseQuery.skip(skip).limit(limit);

      const [list, total] = await Promise.all([
        mongooseQuery.lean(),
        this.projectModel.countDocuments(filter),
      ]);

      return toPaginatedResult(list, total, shouldPaginate, page, limit);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error fetching projects',
        developerMessage: error?.message,
      });
    }
  }

  async getOne(id: string, userId: string) {
    try {
      const project = await this.projectModel
        .findOne({ _id: id, isDeleted: false })
        .select('-__v')
        .lean();
      if (!project) throw new NotFoundException('Project not found');
      await this.workspacesService.assertUserIsMember(project.workspaceId.toString(), userId);
      return project;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error fetching project',
        developerMessage: error?.message,
      });
    }
  }

  async create(dto: CreateProjectDto, userId: string) {
    try {
      await this.workspacesService.assertUserIsMember(dto.workspaceId, userId);
      return await this.projectModel.create(dto);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error creating project',
        developerMessage: error?.message,
      });
    }
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    try {
      const project = await this.projectModel.findOne({ _id: id, isDeleted: false });
      if (!project) throw new NotFoundException('Project not found');
      await this.workspacesService.assertUserIsMember(project.workspaceId.toString(), userId);

      const updated = await this.projectModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: dto },
        { new: true, runValidators: true },
      );
      return updated;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error updating project',
        developerMessage: error?.message,
      });
    }
  }

  async remove(id: string, userId: string) {
    try {
      const project = await this.projectModel.findOne({ _id: id, isDeleted: false });
      if (!project) throw new NotFoundException('Project not found');
      await this.workspacesService.assertUserIsMember(project.workspaceId.toString(), userId);

      const deleted = await this.projectModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true },
      );
      if (!deleted) throw new NotFoundException('Project not found');
      return true;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error deleting project',
        developerMessage: error?.message,
      });
    }
  }
}