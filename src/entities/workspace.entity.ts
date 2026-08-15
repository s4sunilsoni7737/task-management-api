import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false })
export class WorkspaceEntity extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false })
  avatarUrl: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'UserEntity', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'UserEntity', required: false, default: [] })
  memberIds: Types.ObjectId[];

  @Prop({ required: false, default: false })
  isDeleted: boolean;

  @Prop({ required: false, default: null })
  deletedAt: Date;
}

export const WorkspaceCollectionName = 'workspaces';
export const WorkspaceSchema = SchemaFactory.createForClass(WorkspaceEntity);
WorkspaceSchema.index({ ownerId: 1, isDeleted: 1 });
