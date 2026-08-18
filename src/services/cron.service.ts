import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskEntity } from '../entities/task.entity';
import { TaskStatus } from '../enums/task-status.enum';
import { ActivityService } from './activity.service';
import { ActivityType } from '../enums/activity-type.enum';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectModel(TaskEntity.name) private readonly taskModel: Model<TaskEntity>,
    private readonly activityService: ActivityService,
  ) {}

  async transitionOverdueTasks() {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of day for comparison

      // Find all tasks that are overdue and not already in BACKLOG or COMPLETED
      const overdueTasks = await this.taskModel.find({
        dueDate: { $lt: now, $ne: null },
        status: { $nin: [TaskStatus.COMPLETED, TaskStatus.BACKLOG] },
        isDeleted: false,
      });

      if (!overdueTasks.length) {
        this.logger.log('No overdue tasks to transition.');
        return { success: true, processed: 0 };
      }

      this.logger.log(`Found ${overdueTasks.length} overdue tasks to transition to BACKLOG.`);

      const taskIds = overdueTasks.map((t) => t._id);

      // Bulk update tasks to BACKLOG
      await this.taskModel.updateMany(
        { _id: { $in: taskIds } },
        { $set: { status: TaskStatus.BACKLOG } },
      );

      // Record activity logs for each transitioned task
      for (const task of overdueTasks) {
        await this.activityService.record({
          taskId: task._id,
          actorId: null, // System event
          type: ActivityType.STATUS_CHANGE,
          fromValue: task.status,
          toValue: TaskStatus.BACKLOG,
          message: 'System automatically moved overdue task to Backlog',
        });
      }

      this.logger.log(`Successfully transitioned ${overdueTasks.length} overdue tasks.`);
      return { success: true, processed: overdueTasks.length };
    } catch (error) {
      this.logger.error('Error transitioning overdue tasks', error);
      throw error;
    }
  }
}
