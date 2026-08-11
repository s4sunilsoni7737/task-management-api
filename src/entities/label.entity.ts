import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types , Schema as MongooseSchema } from 'mongoose';

/**
 * Workspace-level label taxonomy (e.g. Research, Design, Development,
 * Testing, Deployment) applied to Tasks via multi-select chips.
 */
@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false })
export class LabelEntity extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'WorkspaceEntity', required: true, index: true })
  workspaceId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, default: '#6366F1' })
  color: string;

  @Prop({ required: false, default: false })
  isDeleted: boolean;

  @Prop({ required: false, default: null })
  deletedAt: Date;
}

export const LabelCollectionName = 'labels';
export const LabelSchema = SchemaFactory.createForClass(LabelEntity);
LabelSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
