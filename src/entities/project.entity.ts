import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaskPriority } from '../enums/task-priority.enum';

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false })
export class ProjectEntity extends Document {
  @Prop({ type: Types.ObjectId, ref: 'WorkspaceEntity', required: true, index: true })
  workspaceId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, trim: true })
  description: string;

  @Prop({ required: false, enum: TaskPriority, default: TaskPriority.NO_PRIORITY })
  priority: TaskPriority;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: false, default: null })
  leadId: Types.ObjectId;

  @Prop({ required: false, default: null })
  dueDate: Date;

  @Prop({ required: false, default: false })
  isDeleted: boolean;

  @Prop({ required: false, default: null })
  deletedAt: Date;
}

export const ProjectCollectionName = 'projects';
export const ProjectSchema = SchemaFactory.createForClass(ProjectEntity);
ProjectSchema.index({ workspaceId: 1, isDeleted: 1 });
ProjectSchema.index({ name: 'text' });