import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Theme } from 'src/enums/theme.enum';
import { ColorMode } from 'src/enums/color-mode.enum';

export type UserDocument = UserEntity & Document;

@Schema({ timestamps: true, collection: 'users' })
export class UserEntity {
  _id: Types.ObjectId;

  @Prop({ trim: true, default: null })
  name: string | null;

  @Prop({ trim: true, lowercase: true, default: null, index: true, sparse: true, unique: true })
  email: string | null;

  @Prop({ default: null })
  avatarUrl: string | null;

  // Present only for Google-authenticated users; null for guests.
  @Prop({ default: null, index: true, sparse: true })
  googleId: string | null;

  @Prop({ default: true })
  isGuest: boolean;

  @Prop({ type: String, enum: Theme, default: Theme.LIGHT })
  theme: Theme;

  @Prop({ type: String, enum: ColorMode, default: ColorMode.BLACK })
  colorMode: ColorMode;

  @Prop({ type: Types.ObjectId, ref: 'WorkspaceEntity', default: null })
  defaultWorkspaceId: Types.ObjectId | null;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);
