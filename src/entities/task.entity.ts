import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types , Schema as MongooseSchema } from 'mongoose';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false })
export class TaskEntity extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'WorkspaceEntity', required: true, index: true })
  workspaceId: Types.ObjectId;

  // Null for a workspace-level task that doesn't belong to a Project.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProjectEntity', required: false, default: null, index: true })
  projectId: Types.ObjectId;

  // Present when this Task is a subtask; points at the parent Task.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TaskEntity', required: false, default: null, index: true })
  parentTaskId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: false, trim: true })
  description: string;

  @Prop({ required: false, enum: TaskStatus, default: TaskStatus.TODO, index: true })
  status: TaskStatus;

  @Prop({ required: false, enum: TaskPriority, default: TaskPriority.NO_PRIORITY, index: true })
  priority: TaskPriority;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'UserEntity', required: false, default: [] })
  memberIds: Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'LabelEntity', required: false, default: [] })
  labelIds: Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'UserEntity', required: false, default: null })
  reporterId: Types.ObjectId;

  @Prop({ required: false, trim: true })
  teamId: string;

  @Prop({ required: false, default: null })
  startDate: Date;

  @Prop({ required: false, default: null })
  endDate: Date;

  // Displayed as the single "Due Date" chip in List/Board views.
  @Prop({ required: false, default: null })
  dueDate: Date;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    required: false,
    default: [],
  })
  resources: { name: string; url: string; addedAt: Date }[];

  @Prop({ required: false, default: false })
  isPrivate: boolean;

  @Prop({ required: false, default: false })
  isLocked: boolean;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'UserEntity', required: false, default: [] })
  watcherIds: Types.ObjectId[];

  @Prop({ required: false, default: false })
  isDeleted: boolean;

  @Prop({ required: false, default: null })
  deletedAt: Date;
}

export const TaskCollectionName = 'tasks';
export const TaskSchema = SchemaFactory.createForClass(TaskEntity);
TaskSchema.index({ workspaceId: 1, status: 1, isDeleted: 1 });
TaskSchema.index({ projectId: 1, isDeleted: 1 });
TaskSchema.index({ title: 'text', description: 'text' });
