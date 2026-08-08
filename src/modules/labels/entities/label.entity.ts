import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LabelDocument = LabelEntity & Document;

/**
 * Workspace-level label taxonomy (e.g. Research, Design, Development,
 * Testing, Deployment) applied to Tasks via multi-select chips.
 */
@Schema({ timestamps: true, collection: 'labels' })
export class LabelEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkspaceEntity', required: true, index: true })
  workspaceId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, default: '#6366F1' })
  color: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const LabelSchema = SchemaFactory.createForClass(LabelEntity);
LabelSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
