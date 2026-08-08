import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ActivityType } from 'src/common/enums';

export type ActivityLogDocument = ActivityLogEntity & Document;

/**
 * Append-only audit entries feeding a Task's Updates/Activity panel, e.g.
 * "You changed priority from No priority to Urgent". Never updated or
 * soft-deleted — writes only.
 */
@Schema({ timestamps: true, collection: 'activity_logs' })
export class ActivityLogEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TaskEntity', required: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true })
  actorId: Types.ObjectId;

  @Prop({ type: String, enum: ActivityType, required: true })
  type: ActivityType;

  @Prop({ default: null })
  fromValue: string | null;

  @Prop({ default: null })
  toValue: string | null;

  // Human-readable rendering, e.g. "changed priority from No priority to Urgent"
  @Prop({ required: true, trim: true })
  message: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLogEntity);
ActivityLogSchema.index({ taskId: 1, createdAt: -1 });
