import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Theme } from '../enums/theme.enum';
import { ColorMode } from '../enums/color-mode.enum';

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false })
export class UserEntity extends Document {
  @Prop({ required: false, trim: true })
  name: string;

  @Prop({ required: false, index: true, lowercase: true, trim: true, sparse: true, unique: true })
  email: string;

  @Prop({ required: false })
  avatarUrl: string;

  // Present only for Google-authenticated users; null for guests.
  @Prop({ required: false, index: true, sparse: true })
  googleId: string;

  @Prop({ required: false, default: true })
  isGuest: boolean;

  @Prop({ required: false, enum: Theme, default: Theme.LIGHT })
  theme: Theme;

  @Prop({ required: false, enum: ColorMode, default: ColorMode.BLACK })
  colorMode: ColorMode;

  @Prop({ type: Types.ObjectId, ref: 'WorkspaceEntity', required: false, default: null })
  defaultWorkspaceId: Types.ObjectId;

  @Prop({ required: false, default: false })
  isDeleted: boolean;

  @Prop({ required: false, default: null })
  deletedAt: Date;
}

export const UserCollectionName = 'users';
export const UserSchema = SchemaFactory.createForClass(UserEntity);