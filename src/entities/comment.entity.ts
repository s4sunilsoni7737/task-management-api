import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false })
export class CommentEntity extends Document {
  @Prop({ type: Types.ObjectId, ref: 'TaskEntity', required: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    required: false,
    default: [],
  })
  attachments: { name: string; url: string }[];

  @Prop({ required: false, default: false })
  isDeleted: boolean;

  @Prop({ required: false, default: null })
  deletedAt: Date;
}

export const CommentCollectionName = 'comments';
export const CommentSchema = SchemaFactory.createForClass(CommentEntity);
CommentSchema.index({ taskId: 1, isDeleted: 1, createdAt: 1 });