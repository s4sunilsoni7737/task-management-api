import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = CommentEntity & Document;

@Schema({ timestamps: true, collection: 'comments' })
export class CommentEntity {
  _id: Types.ObjectId;

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
    default: [],
  })
  attachments: { name: string; url: string }[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(CommentEntity);
CommentSchema.index({ taskId: 1, isDeleted: 1, createdAt: 1 });
