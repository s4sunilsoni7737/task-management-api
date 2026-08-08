import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaskPriority } from 'src/enums/task-priority.enum';

export type ProjectDocument = ProjectEntity & Document;

@Schema({ timestamps: true, collection: 'projects' })
export class ProjectEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkspaceEntity', required: true, index: true })
  workspaceId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: null, trim: true })
  description: string | null;

  @Prop({ type: String, enum: TaskPriority, default: TaskPriority.NO_PRIORITY })
  priority: TaskPriority;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', default: null })
  leadId: Types.ObjectId | null;

  @Prop({ default: null })
  dueDate: Date | null;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(ProjectEntity);
ProjectSchema.index({ workspaceId: 1, isDeleted: 1 });
ProjectSchema.index({ name: 'text' });
