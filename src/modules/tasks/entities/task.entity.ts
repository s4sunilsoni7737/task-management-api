import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaskPriority, TaskStatus } from 'src/common/enums';

export type TaskDocument = TaskEntity & Document;

@Schema({ timestamps: true, collection: 'tasks' })
export class TaskEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkspaceEntity', required: true, index: true })
  workspaceId: Types.ObjectId;

  // Null for a workspace-level task that doesn't belong to a Project.
  @Prop({ type: Types.ObjectId, ref: 'ProjectEntity', default: null, index: true })
  projectId: Types.ObjectId | null;

  // Present when this Task is a subtask; points at the parent Task.
  @Prop({ type: Types.ObjectId, ref: 'TaskEntity', default: null, index: true })
  parentTaskId: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: null, trim: true })
  description: string | null;

  @Prop({ type: String, enum: TaskStatus, default: TaskStatus.TODO, index: true })
  status: TaskStatus;

  @Prop({ type: String, enum: TaskPriority, default: TaskPriority.NO_PRIORITY, index: true })
  priority: TaskPriority;

  @Prop({ type: [Types.ObjectId], ref: 'UserEntity', default: [] })
  memberIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'LabelEntity', default: [] })
  labelIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', default: null })
  reporterId: Types.ObjectId | null;

  @Prop({ default: null, trim: true })
  teamId: string | null;

  @Prop({ default: null })
  startDate: Date | null;

  @Prop({ default: null })
  endDate: Date | null;

  // Displayed as the single "Due Date" chip in List/Board views.
  @Prop({ default: null })
  dueDate: Date | null;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  resources: { name: string; url: string; addedAt: Date }[];

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'UserEntity', default: [] })
  watcherIds: Types.ObjectId[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(TaskEntity);
TaskSchema.index({ workspaceId: 1, status: 1, isDeleted: 1 });
TaskSchema.index({ projectId: 1, isDeleted: 1 });
TaskSchema.index({ parentTaskId: 1 });
TaskSchema.index({ title: 'text', description: 'text' });
