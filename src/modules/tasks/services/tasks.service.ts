import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TaskDocument, TaskEntity } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskListQueryDto } from '../dto/task-list-query.dto';
import { CreateSubtaskDto } from '../dto/create-subtask.dto';
import { AddTaskResourceDto } from '../dto/add-task-resource.dto';
import { WorkspacesService } from 'src/modules/workspaces/services/workspaces.service';
import { ActivityService } from 'src/modules/activity/services/activity.service';
import { ActivityType, TaskPriority, TaskStatus } from 'src/common/enums';
import { escapeRegex } from 'src/common/utils/search.util';
import { buildPagination, toPaginatedResult } from 'src/common/utils/pagination.util';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.NO_PRIORITY]: 'No priority',
  [TaskPriority.URGENT]: 'Urgent',
  [TaskPriority.HIGH]: 'High',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.LOW]: 'Low',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'Backlog',
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.DOING]: 'Doing',
  [TaskStatus.COMPLETED]: 'Completed',
  [TaskStatus.ON_HOLD]: 'On Hold',
};

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(TaskEntity.name) private readonly taskModel: Model<TaskDocument>,
    private readonly workspacesService: WorkspacesService,
    private readonly activityService: ActivityService,
  ) {}

  async getAll(query: TaskListQueryDto, userId: string) {
    try {
      await this.workspacesService.assertUserIsMember(query.workspaceId, userId);

      const filter = this._buildFilter(query);

      if (query.groupByStatus) {
        return this._getGroupedByStatus(filter);
      }

      const { sortBy = 'createdAt', sortOrder = 'desc' } = query;
      const { shouldPaginate, skip, page, limit } = buildPagination(query.page, query.limit);
      const sortCondition: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      let mongooseQuery = this.taskModel.find(filter).sort(sortCondition).select('-__v');
      if (shouldPaginate) mongooseQuery = mongooseQuery.skip(skip).limit(limit);

      const [list, total] = await Promise.all([
        mongooseQuery.lean(),
        this.taskModel.countDocuments(filter),
      ]);

      return toPaginatedResult(list, total, shouldPaginate, page, limit);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error fetching tasks',
        developerMessage: error?.message,
      });
    }
  }

  async getOne(id: string, userId: string) {
    try {
      const task = await this.taskModel.findOne({ _id: id, isDeleted: false }).select('-__v').lean();
      if (!task) throw new NotFoundException('Task not found');
      await this.workspacesService.assertUserIsMember(task.workspaceId.toString(), userId);
      return task;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error fetching task',
        developerMessage: error?.message,
      });
    }
  }

  async getSubtasks(parentTaskId: string, userId: string) {
    try {
      const parent = await this.taskModel.findOne({ _id: parentTaskId, isDeleted: false }).lean();
      if (!parent) throw new NotFoundException('Task not found');
      await this.workspacesService.assertUserIsMember(parent.workspaceId.toString(), userId);

      return await this.taskModel
        .find({ parentTaskId, isDeleted: false })
        .sort({ createdAt: 1 })
        .select('-__v')
        .lean();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error fetching subtasks',
        developerMessage: error?.message,
      });
    }
  }

  async create(dto: CreateTaskDto, userId: string) {
    try {
      await this.workspacesService.assertUserIsMember(dto.workspaceId, userId);

      const created = await this.taskModel.create({
        ...dto,
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority ?? TaskPriority.NO_PRIORITY,
        reporterId: dto.reporterId ?? userId,
      });

      await this.activityService.record({
        taskId: created._id,
        actorId: userId,
        type: ActivityType.CREATED,
        message: 'You created this task',
      });

      return created;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error creating task',
        developerMessage: error?.message,
      });
    }
  }

  async createSubtask(parentTaskId: string, dto: CreateSubtaskDto, userId: string) {
    try {
      const parent = await this.taskModel.findOne({ _id: parentTaskId, isDeleted: false });
      if (!parent) throw new NotFoundException('Parent task not found');
      await this.workspacesService.assertUserIsMember(parent.workspaceId.toString(), userId);

      const subtask = await this.taskModel.create({
        workspaceId: parent.workspaceId,
        projectId: parent.projectId,
        parentTaskId: parent._id,
        title: dto.title,
        memberIds: dto.memberIds ?? [],
        dueDate: dto.dueDate ?? null,
        status: TaskStatus.TODO,
        priority: TaskPriority.NO_PRIORITY,
        reporterId: userId,
      });

      await this.activityService.record({
        taskId: parent._id,
        actorId: userId,
        type: ActivityType.SUBTASK_ADDED,
        message: `You added a subtask "${dto.title}"`,
      });

      return subtask;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error creating subtask',
        developerMessage: error?.message,
      });
    }
  }

  async update(id: string, dto: UpdateTaskDto, userId: string) {
    try {
      const task = await this.taskModel.findOne({ _id: id, isDeleted: false });
      if (!task) throw new NotFoundException('Task not found');
      await this.workspacesService.assertUserIsMember(task.workspaceId.toString(), userId);

      const activityEntries = this._diffForActivity(task, dto);

      Object.assign(task, dto);
      await task.save();

      for (const entry of activityEntries) {
        await this.activityService.record({ taskId: task._id, actorId: userId, ...entry });
      }

      return task;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error updating task',
        developerMessage: error?.message,
      });
    }
  }

  async addResource(id: string, dto: AddTaskResourceDto, userId: string) {
    try {
      const task = await this.taskModel.findOne({ _id: id, isDeleted: false });
      if (!task) throw new NotFoundException('Task not found');
      await this.workspacesService.assertUserIsMember(task.workspaceId.toString(), userId);

      task.resources.push({ name: dto.name, url: dto.url, addedAt: new Date() });
      await task.save();
      return task;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error attaching resource',
        developerMessage: error?.message,
      });
    }
  }

  async toggleWatch(id: string, userId: string, watch: boolean) {
    try {
      const task = await this.taskModel.findOne({ _id: id, isDeleted: false });
      if (!task) throw new NotFoundException('Task not found');
      await this.workspacesService.assertUserIsMember(task.workspaceId.toString(), userId);

      const userObjectId = new Types.ObjectId(userId);
      const isWatching = task.watcherIds.some((w) => w.equals(userObjectId));

      if (watch && !isWatching) {
        task.watcherIds.push(userObjectId);
      } else if (!watch && isWatching) {
        task.watcherIds = task.watcherIds.filter((w) => !w.equals(userObjectId));
      }
      await task.save();
      return task;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error updating watch status',
        developerMessage: error?.message,
      });
    }
  }

  async remove(id: string, userId: string) {
    try {
      const task = await this.taskModel.findOne({ _id: id, isDeleted: false });
      if (!task) throw new NotFoundException('Task not found');
      await this.workspacesService.assertUserIsMember(task.workspaceId.toString(), userId);

      task.isDeleted = true;
      task.deletedAt = new Date();
      await task.save();

      // Soft-delete any subtasks along with the parent — never cascade hard-delete.
      await this.taskModel.updateMany(
        { parentTaskId: task._id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      );

      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error deleting task',
        developerMessage: error?.message,
      });
    }
  }

  /** Used by CommentsModule/ActivityModule callers to authorize task access before acting on comments/activity. */
  async assertAccessAndGet(taskId: string, userId: string): Promise<TaskDocument> {
    const task = await this.taskModel.findOne({ _id: taskId, isDeleted: false });
    if (!task) throw new NotFoundException('Task not found');
    await this.workspacesService.assertUserIsMember(task.workspaceId.toString(), userId);
    return task;
  }

  private _buildFilter(query: TaskListQueryDto) {
    const filter: any = { workspaceId: query.workspaceId, isDeleted: false };

    if (query.projectId) {
      if (!Types.ObjectId.isValid(query.projectId)) throw new BadRequestException('Invalid projectId');
      filter.projectId = query.projectId;
    }
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.memberId) filter.memberIds = query.memberId;
    if (query.labelId) filter.labelIds = query.labelId;
    if (query.topLevelOnly !== false) filter.parentTaskId = null;

    if (query.q) {
      const searchRegex = escapeRegex(query.q);
      filter.$or = [
        { title: { $regex: searchRegex, $options: 'i' } },
        { description: { $regex: searchRegex, $options: 'i' } },
      ];
    }

    return filter;
  }

  private async _getGroupedByStatus(filter: any) {
    const tasks = await this.taskModel.find(filter).sort({ createdAt: -1 }).select('-__v').lean();

    const grouped: Record<string, any[]> = {};
    for (const status of Object.values(TaskStatus)) grouped[status] = [];
    for (const task of tasks) {
      grouped[task.status] = grouped[task.status] || [];
      grouped[task.status].push(task);
    }
    return { grouped, total: tasks.length };
  }

  /**
   * Compares the incoming DTO against the current task to build a list of
   * human-readable activity-log entries — mirrors the admin portal's
   * "You changed priority from No priority to Urgent" pattern.
   */
  private _diffForActivity(task: TaskDocument, dto: UpdateTaskDto) {
    const entries: {
      type: ActivityType;
      message: string;
      fromValue?: string | null;
      toValue?: string | null;
    }[] = [];

    if (dto.status && dto.status !== task.status) {
      entries.push({
        type: ActivityType.STATUS_CHANGE,
        message: `You changed status from ${STATUS_LABELS[task.status]} to ${STATUS_LABELS[dto.status]}`,
        fromValue: task.status,
        toValue: dto.status,
      });
    }
    if (dto.priority && dto.priority !== task.priority) {
      entries.push({
        type: ActivityType.PRIORITY_CHANGE,
        message: `You changed priority from ${PRIORITY_LABELS[task.priority]} to ${PRIORITY_LABELS[dto.priority]}`,
        fromValue: task.priority,
        toValue: dto.priority,
      });
    }
    if (dto.dueDate && new Date(dto.dueDate).getTime() !== task.dueDate?.getTime()) {
      entries.push({
        type: ActivityType.DUE_DATE_CHANGE,
        message: 'You updated the due date',
        fromValue: task.dueDate?.toISOString() ?? null,
        toValue: dto.dueDate,
      });
    }
    if (dto.memberIds) {
      const before = task.memberIds.map((m) => m.toString()).sort().join(',');
      const after = [...dto.memberIds].sort().join(',');
      if (before !== after) {
        entries.push({ type: ActivityType.ASSIGNEE_CHANGE, message: 'You updated the assigned members' });
      }
    }
    if (dto.labelIds) {
      const before = task.labelIds.map((l) => l.toString()).sort().join(',');
      const after = [...dto.labelIds].sort().join(',');
      if (before !== after) {
        entries.push({ type: ActivityType.LABEL_CHANGE, message: 'You updated the labels' });
      }
    }
    if (dto.title && dto.title !== task.title) {
      entries.push({ type: ActivityType.TITLE_CHANGE, message: 'You updated the task title' });
    }
    if (dto.description !== undefined && dto.description !== task.description) {
      entries.push({ type: ActivityType.DESCRIPTION_CHANGE, message: 'You updated the description' });
    }

    return entries;
  }
}
