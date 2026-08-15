import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ActivityType } from '../enums/activity-type.enum';

/**
 * Append-only audit entries feeding a Task's Updates/Activity panel, e.g.
 * "You changed priority from No priority to Urgent". Never updated or
 * soft-deleted — writes only.
 */
@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false })
export class ActivityLogEntity extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TaskEntity', required: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'UserEntity', required: true })
  actorId: Types.ObjectId;

  @Prop({ required: true, enum: ActivityType })
  type: ActivityType;

  @Prop({ required: false, default: null })
  fromValue: string;

  @Prop({ required: false, default: null })
  toValue: string;

  // Human-readable rendering, e.g. "changed priority from No priority to Urgent"
  @Prop({ required: true, trim: true })
  message: string;
}

export const ActivityLogCollectionName = 'activity_logs';
export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLogEntity);
ActivityLogSchema.index({ taskId: 1, createdAt: -1 });
