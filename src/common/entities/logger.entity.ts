import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema({ timestamps: true })
export class LoggerEntity {
  @Prop({ required: true })
  requestMethod: string;

  @Prop({ required: true })
  requestUrl: string;

  @Prop({ required: false, type: Object, default: null })
  requestHeaders: Record<string, any>;

  @Prop({ required: false, type: Object, default: null })
  requestBody: Record<string, any>;

  @Prop({ required: false })
  statusCode: number;

  @Prop({ required: false, type: Object })
  responseBody: Record<string, any>;

  @Prop({ required: false, type: SchemaTypes.Date })
  startTime: Date;

  @Prop({ required: false, type: SchemaTypes.Date })
  endTime: Date;

  @Prop({ required: false })
  executionTime: number;

  @Prop({ required: false, default: '' })
  error: string;
}
export const LoggerCollectionName = 'loggers';
export const LoggerSchema = SchemaFactory.createForClass(LoggerEntity);

// Auto delete logs older than 2 days (172800 seconds)
LoggerSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });
