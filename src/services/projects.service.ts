import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProjectCollectionName, ProjectEntity } from '../entities/project.entity';
import { TaskCollectionName, TaskEntity } from '../entities/task.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectListQueryDto } from '../dto/project-list-query.dto';
import { WorkspacesService } from './workspaces.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(ProjectEntity.name) private readonly projectModel: Model<ProjectEntity>,
    @InjectModel(TaskEntity.name) private readonly taskModel: Model<TaskEntity>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getAll(query: ProjectListQueryDto, userId: string) {
    try {
      const workspaceId = await this.workspacesService.resolveWorkspaceId(
        query.workspaceId,
        userId,
      );

      const { search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = query;
      const skip = (Number(page) - 1) * Number(limit);

      const filter: any = { workspaceId, isDeleted: false };
      if (search) {
        const searchRegex = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.name = { $regex: searchRegex, $options: 'i' };
      }

      const sortCondition: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [rawList, total] = await Promise.all([
        this.projectModel
          .find(filter)
          .sort(sortCondition)
          .skip(skip)
          .limit(Number(limit))
          .populate('leadId', 'name email avatarUrl')
          .select('-__v')
          .lean(),
        this.projectModel.countDocuments(filter),
      ]);

      const projectIds = rawList.map((p) => new Types.ObjectId(p._id as unknown as string));
      const taskCounts = await this.taskModel.aggregate([
        { $match: { projectId: { $in: projectIds }, isDeleted: false } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
      ]);
      const countMap = new Map<string, number>(
        taskCounts.map((t) => [String(t._id), Number(t.count)]),
      );

      const list = rawList.map((p) => ({
        ...p,
        taskCount: countMap.get(p._id.toString()) ?? 0,
      }));

      return {
        list,
        total,
        page: Number(page),
        limit: Number(limit),
      };
    } catch (error) {
      console.log('🚀 ~ ProjectsService ~ getAll ~ error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
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
        .populate('leadId', 'name email avatarUrl')
        .select('-__v')
        .lean();

      if (!project) throw new NotFoundException('Project not found');
      await this.workspacesService.assertUserIsMember(project.workspaceId.toString(), userId);

      const taskCountResult = await this.taskModel.aggregate([
        { $match: { projectId: new Types.ObjectId(project._id as unknown as string), isDeleted: false } },
        { $count: 'count' },
      ]);
      const taskCount = taskCountResult.length > 0 ? taskCountResult[0].count : 0;

      return { ...project, taskCount };
    } catch (error) {
      console.log('🚀 ~ ProjectsService ~ getOne ~ error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error fetching project',
        developerMessage: error?.message,
      });
    }
  }

  async create(dto: CreateProjectDto, userId: string) {
    try {
      const workspaceId = await this.workspacesService.resolveWorkspaceId(dto.workspaceId, userId);
      const created = await this.projectModel.create({ ...dto, workspaceId });
      await created.populate('leadId', 'name email avatarUrl');

      return { ...created.toJSON(), taskCount: 0 };
    } catch (error) {
      console.log('🚀 ~ ProjectsService ~ create ~ error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
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

      const updated = await this.projectModel
        .findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: dto },
          { new: true, runValidators: true },
        )
        .populate('leadId', 'name email avatarUrl')
        .select('-__v')
        .lean();

      if (!updated) throw new NotFoundException('Project not found');
      return updated;
    } catch (error) {
      console.log('🚀 ~ ProjectsService ~ update ~ error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
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
    } catch (error) {
      console.log('🚀 ~ ProjectsService ~ remove ~ error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error deleting project',
        developerMessage: error?.message,
      });
    }
  }
}
