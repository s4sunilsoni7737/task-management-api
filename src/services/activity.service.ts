import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLogCollectionName, ActivityLogEntity } from '../entities/activity-log.entity';
import { ActivityType } from '../enums/activity-type.enum';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(ActivityLogEntity.name)
    private readonly activityLogModel: Model<ActivityLogEntity>,
  ) {}

  /**
   * ✅ PATTERN: append-only write — never updated or deleted afterwards.
   * Called from TasksService/CommentsService whenever a tracked field
   * changes, so failures here must never block the primary write; callers
   * should treat this as best-effort.
   */
  async record(params: {
    taskId: string | Types.ObjectId;
    actorId?: string | Types.ObjectId | null;
    type: ActivityType;
    message: string;
    fromValue?: string | null;
    toValue?: string | null;
  }) {
    try {
      return await this.activityLogModel.create({
        taskId: params.taskId,
        actorId: params.actorId,
        type: params.type,
        message: params.message,
        fromValue: params.fromValue ?? null,
        toValue: params.toValue ?? null,
      });
    } catch (error) {
      console.log('🚀 ~ ActivityService ~ record ~ error:', error);
      throw new BadRequestException({
        userMessage: 'Error recording activity',
        developerMessage: error?.message,
      });
    }
  }

  async getForTask(taskId: string) {
    try {
      return await this.activityLogModel
        .find({ taskId })
        .populate('actorId', 'name email avatarUrl')
        .sort({ createdAt: -1 })
        .select('-__v')
        .lean();
    } catch (error) {
      console.log('🚀 ~ ActivityService ~ getForTask ~ error:', error);
      throw new BadRequestException({
        userMessage: 'Error fetching activity log',
        developerMessage: error?.message,
      });
    }
  }
}
