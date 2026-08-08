import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkspaceDocument = WorkspaceEntity & Document;

@Schema({ timestamps: true, collection: 'workspaces' })
export class WorkspaceEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: null })
  avatarUrl: string | null;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'UserEntity', default: [] })
  memberIds: Types.ObjectId[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const WorkspaceSchema = SchemaFactory.createForClass(WorkspaceEntity);
WorkspaceSchema.index({ ownerId: 1, isDeleted: 1 });
