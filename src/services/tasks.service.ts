import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TaskCollectionName, TaskEntity } from 'src/entities/task.entity';
import { CreateTaskDto } from 'src/dto/create-task.dto';
import { UpdateTaskDto } from 'src/dto/update-task.dto';
import { TaskListQueryDto } from 'src/dto/task-list-query.dto';
import { CreateSubtaskDto } from 'src/dto/create-subtask.dto';
import { AddTaskResourceDto } from 'src/dto/add-task-resource.dto';
import { CommentCollectionName, CommentEntity } from 'src/entities/comment.entity';
import { WorkspacesService } from 'src/services/workspaces.service';
import { ActivityService } from 'src/services/activity.service';
import { ActivityType } from 'src/enums/activity-type.enum';
import { TaskPriority } from 'src/enums/task-priority.enum';
import { TaskStatus } from 'src/enums/task-status.enum';

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
    @InjectModel(TaskCollectionName) private readonly taskModel: Model<TaskEntity>,
    @InjectModel(CommentCollectionName) private readonly commentModel: Model<CommentEntity>,
    private readonly workspacesService: WorkspacesService,
    private readonly activityService: ActivityService,
  ) {}

  async getAll(query: TaskListQueryDto, userId: string) {
    try {
      const workspaceId = await this.workspacesService.resolveWorkspaceId(query.workspaceId, userId);
      const filter = this._buildFilter(query, workspaceId);

      if (query.groupByStatus) {
        const rawTasks = await this.taskModel
          .find(filter)
          .sort({ createdAt: -1 })
          .populate('memberIds', 'name email avatarUrl')
          .populate('labelIds', 'name color workspaceId')
          .populate('reporterId', 'name email avatarUrl')
          .select('-__v')
          .lean();

        const tasksWithCounts = await this._attachCounts(rawTasks);
        
        const grouped: Record<string, any[]> = {};
        for (const status of Object.values(TaskStatus)) grouped[status] = [];
        for (const task of tasksWithCounts) {
          const status = task.status as string;
          grouped[status] = grouped[status] || [];
          grouped[status].push(task);
        }
        return { grouped, total: tasksWithCounts.length };
      }

      const { sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = query;
      const skip = (Number(page) - 1) * Number(limit);
      const sortCondition: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [rawList, total] = await Promise.all([
        this.taskModel
          .find(filter)
          .sort(sortCondition)
          .skip(skip)
          .limit(Number(limit))
          .populate('memberIds', 'name email avatarUrl')
          .populate('labelIds', 'name color workspaceId')
          .populate('reporterId', 'name email avatarUrl')
          .select('-__v')
          .lean(),
        this.taskModel.countDocuments(filter),
      ]);

      const list = await this._attachCounts(rawList);

      return {
        list,
        total,
        page: Number(page),
        limit: Number(limit),
      };
    } catch (error) {
      console.log('🚀 ~ TasksService ~ getAll ~ error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error fetching tasks',
        developerMessage: error?.message,
      });
    }
  }

  async getOne(id: string, userId: string) {
    try {
      const task = await this.taskModel
        .findOne({ _id: id, isDeleted: false })
        .populate('memberIds', 'name email avatarUrl')
        .populate('labelIds', 'name color workspaceId')
        .populate('reporterId', 'name email avatarUrl')
        .select('-__v')
        .lean();
        
      if (!task) throw new NotFoundException('Task not found');
      await this.workspacesService.assertUserIsMember(task.workspaceId.toString(), userId);
      
      const tasksWithCounts = await this._attachCounts([task]);
      return tasksWithCounts[0];
    } catch (error) {
      console.log('🚀 ~ TasksService ~ getOne ~ error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
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

      const subtasks = await this.taskModel
        .find({ parentTaskId, isDeleted: false })
        .sort({ createdAt: 1 })
        .populate('memberIds', 'name email avatarUrl')
        .populate('labelIds', 'name color workspaceId')
        .populate('reporterId', 'name email avatarUrl')
        .select('-__v')
        .lean();
        
      return await this._attachCounts(subtasks);
    } catch (error) {
      console.log('🚀 ~ TasksService ~ getSubtasks ~ error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error fetching subtasks',
        developerMessage: error?.message,
      });
    }
  }

  async create(dto: CreateTaskDto, userId: string) {
    try {
      const workspaceId = await this.workspacesService.resolveWorkspaceId(dto.workspaceId, userId);

      const created = await this.taskModel.create({
        ...dto,
        workspaceId,
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority ?? TaskPriority.NO_PRIORITY,
        reporterId: dto.reporterId ?? userId,
      });
      
      await created.populate('memberIds', 'name email avatarUrl');
      await created.populate('labelIds', 'name color workspaceId');
      await created.populate('reporterId', 'name email avatarUrl');

      await this.activityService.record({
        taskId: created._id,
        actorId: userId,
        type: ActivityType.CREATED,
        message: 'You created this task',
      });

      return { ...created.toJSON(), subtaskCount: 0, commentCount: 0, watcherCount: 0 };
    } catch (error) {
      console.log('🚀 ~ TasksService ~ create ~ error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
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
      
      await subtask.populate('memberIds', 'name email avatarUrl');
      await subtask.populate('labelIds', 'name color workspaceId');
      await subtask.populate('reporterId', 'name email avatarUrl');

      await this.activityService.record({
        taskId: parent._id,
        actorId: userId,
        type: ActivityType.SUBTASK_ADDED,
        message: `You added a subtask "${dto.title}"`,
      });

      return { ...subtask.toJSON(), subtaskCount: 0, commentCount: 0, watcherCount: 0 };
    } catch (error) {
      console.log('🚀 ~ TasksService ~ createSubtask ~ error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
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

      const updateData: any = { ...dto };
      if (updateData.team !== undefined) {
        updateData.teamId = updateData.team;
        delete updateData.team;
      }

      const activityEntries = this._diffForActivity(task, updateData);

      const updated = await this.taskModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .populate('memberIds', 'name email avatarUrl')
      .populate('labelIds', 'name color workspaceId')
      .populate('reporterId', 'name email avatarUrl')
      .select('-__v')
      .lean();
      
      if (!updated) throw new NotFoundException('Task not found');

      for (const entry of activityEntries) {
        await this.activityService.record({ taskId: id, actorId: userId, ...entry });
      }

      const tasksWithCounts = await this._attachCounts([updated]);
      return tasksWithCounts[0];
    } catch (error) {
      console.log('🚀 ~ TasksService ~ update ~ error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
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

      const updated = await this.taskModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $push: { resources: { name: dto.name, url: dto.url, addedAt: new Date() } } },
        { new: true, runValidators: true },
      )
      .populate('memberIds', 'name email avatarUrl')
      .populate('labelIds', 'name color workspaceId')
      .populate('reporterId', 'name email avatarUrl')
      .select('-__v')
      .lean();
      
      if (!updated) throw new NotFoundException('Task not found');
      
      const tasksWithCounts = await this._attachCounts([updated]);
      return tasksWithCounts[0];
    } catch (error) {
      console.log('🚀 ~ TasksService ~ addResource ~ error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
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

      let update: any;
      if (watch && !isWatching) {
        update = { $addToSet: { watcherIds: userObjectId } };
      } else if (!watch && isWatching) {
        update = { $pull: { watcherIds: userObjectId } };
      } else {
        update = {};
      }

      if (Object.keys(update).length === 0) {
        const existing = await this.taskModel.findOne({ _id: id, isDeleted: false })
          .populate('memberIds', 'name email avatarUrl')
          .populate('labelIds', 'name color workspaceId')
          .populate('reporterId', 'name email avatarUrl')
          .select('-__v')
          .lean();
        const tasksWithCounts = await this._attachCounts([existing]);
        return tasksWithCounts[0];
      }

      const updated = await this.taskModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        update,
        { new: true },
      )
      .populate('memberIds', 'name email avatarUrl')
      .populate('labelIds', 'name color workspaceId')
      .populate('reporterId', 'name email avatarUrl')
      .select('-__v')
      .lean();
      
      if (!updated) throw new NotFoundException('Task not found');
      const tasksWithCounts = await this._attachCounts([updated]);
      return tasksWithCounts[0];
    } catch (error) {
      console.log('🚀 ~ TasksService ~ toggleWatch ~ error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
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

      const deleted = await this.taskModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true },
      );
      if (!deleted) throw new NotFoundException('Task not found');

      await this.taskModel.updateMany(
        { parentTaskId: task._id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      );

      return true;
    } catch (error) {
      console.log('🚀 ~ TasksService ~ remove ~ error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error deleting task',
        developerMessage: error?.message,
      });
    }
  }

  async assertAccessAndGet(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.taskModel.findOne({ _id: taskId, isDeleted: false });
    if (!task) throw new NotFoundException('Task not found');
    await this.workspacesService.assertUserIsMember(task.workspaceId.toString(), userId);
    return task;
  }

  private _buildFilter(query: TaskListQueryDto, workspaceId: string) {
    const filter: any = { workspaceId, isDeleted: false };

    if (query.projectId) {
      if (!Types.ObjectId.isValid(query.projectId))
        throw new BadRequestException('Invalid projectId');
      filter.projectId = query.projectId;
    }
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.memberId) filter.memberIds = query.memberId;
    if (query.labelId) filter.labelIds = query.labelId;
    if (query.topLevelOnly !== false) filter.parentTaskId = null;

    if (query.q) {
      const searchRegex = query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: searchRegex, $options: 'i' } },
        { description: { $regex: searchRegex, $options: 'i' } },
      ];
    }

    return filter;
  }

  private async _attachCounts(rawTasks: any[]) {
    if (!rawTasks.length) return [];
    
    const taskIds = rawTasks.map((t) => t._id.toString());
    
    const [subtaskCounts, commentCounts] = await Promise.all([
      this.taskModel.aggregate([
        { $match: { parentTaskId: { $in: taskIds }, isDeleted: false } },
        { $group: { _id: '$parentTaskId', count: { $sum: 1 } } },
      ]),
      this.commentModel.aggregate([
        { $match: { taskId: { $in: taskIds }, isDeleted: false } },
        { $group: { _id: '$taskId', count: { $sum: 1 } } },
      ]),
    ]);

    const subtaskCountMap = new Map<string, number>(
      subtaskCounts.map((c) => [String(c._id), Number(c.count)]),
    );
    const commentCountMap = new Map<string, number>(
      commentCounts.map((c) => [String(c._id), Number(c.count)]),
    );

    return rawTasks.map((t) => ({
      ...t,
      subtaskCount: subtaskCountMap.get(t._id.toString()) ?? 0,
      commentCount: commentCountMap.get(t._id.toString()) ?? 0,
      watcherCount: (t.watcherIds ?? []).length,
    }));
  }

  private _diffForActivity(task: TaskEntity, dto: UpdateTaskDto) {
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
      const before = task.memberIds
        .map((m) => m.toString())
        .sort()
        .join(',');
      const after = [...dto.memberIds].sort().join(',');
      if (before !== after) {
        entries.push({
          type: ActivityType.ASSIGNEE_CHANGE,
          message: 'You updated the assigned members',
        });
      }
    }
    if (dto.labelIds) {
      const before = task.labelIds
        .map((l) => l.toString())
        .sort()
        .join(',');
      const after = [...dto.labelIds].sort().join(',');
      if (before !== after) {
        entries.push({ type: ActivityType.LABEL_CHANGE, message: 'You updated the labels' });
      }
    }
    if (dto.title && dto.title !== task.title) {
      entries.push({ type: ActivityType.TITLE_CHANGE, message: 'You updated the task title' });
    }
    if (dto.description !== undefined && dto.description !== task.description) {
      entries.push({
        type: ActivityType.DESCRIPTION_CHANGE,
        message: 'You updated the description',
      });
    }

    return entries;
  }
}