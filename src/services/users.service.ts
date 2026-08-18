import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserCollectionName, UserEntity } from '../entities/user.entity';
import { WorkspaceEntity } from '../entities/workspace.entity';
import { UpdateUserPreferencesDto } from '../dto/update-user-preferences.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import { Theme } from '../enums/theme.enum';
import { ColorMode } from '../enums/color-mode.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserEntity.name) private readonly userModel: Model<UserEntity>,
    @InjectModel(WorkspaceEntity.name) private readonly workspaceModel: Model<WorkspaceEntity>
  ) {}

  async getOrCreateDemoUser(role: 'owner' | 'member'): Promise<UserEntity> {
    try {
      const name = role === 'owner' ? 'Demo Owner' : 'Demo Member';
      const existing = await this.userModel.findOne({ name, isDeleted: false });
      if (existing) return existing;

      return await this.userModel.create({
        isGuest: true,
        name,
        theme: Theme.LIGHT,
        colorMode: ColorMode.BLACK,
      });
    } catch (error) {
      console.log('🚀 ~ UsersService ~ getOrCreateDemoUser ~ error:', error);
      throw new BadRequestException({
        userMessage: 'Unable to create demo session',
        developerMessage: error?.message,
      });
    }
  }

  async findOrCreateByGoogleProfile(profile: {
    googleId: string;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
  }): Promise<UserEntity> {
    try {
      const user = await this.userModel.findOneAndUpdate(
        {
          $or: [
            { googleId: profile.googleId },
            ...(profile.email ? [{ email: profile.email }] : []),
          ],
          isDeleted: false,
        },
        {
          $setOnInsert: {
            googleId: profile.googleId,
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
            isGuest: false,
            theme: Theme.LIGHT,
            colorMode: ColorMode.BLACK,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      if (!user.googleId || user.isGuest) {
        if (!user.googleId) user.googleId = profile.googleId;
        user.isGuest = false;
        if (!user.name && profile.name) user.name = profile.name;
        if (!user.avatarUrl && profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
        await user.save();
      }
      return user;
    } catch (error) {
      console.log('🚀 ~ UsersService ~ findOrCreateByGoogleProfile ~ error:', error);
      throw new BadRequestException({
        userMessage: 'Unable to sign in with Google',
        developerMessage: error?.message,
      });
    }
  }

  async findById(userId: string) {
    return this.userModel
      .findOne({ _id: userId, isDeleted: false })
      .select('-__v')
      .lean();
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    let role = 'member';
    
    if (user?.workspaceId) {
      try {
        const workspace = await this.workspaceModel.findOne({ 
          _id: user.workspaceId, 
          isDeleted: false 
        }).lean();
        
        if (workspace && workspace.ownerId.toString() === userId) {
          role = 'owner';
        }
      } catch (e) {
        // Ignore errors fetching workspace role
      }
    }
    
    return { ...user, role };
  }

  async findManyByIds(ids: string[]) {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    return await this.userModel
      .find({ _id: { $in: validIds }, isDeleted: false })
      .select('_id name email avatarUrl isGuest')
      .lean();
  }

  async setWorkspace(userId: string, workspaceId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $set: { workspaceId: workspaceId } });
  }

  async updatePreferences(userId: string, dto: UpdateUserPreferencesDto) {
    try {
      const updated = await this.userModel
        .findOneAndUpdate(
          { _id: userId, isDeleted: false },
          { $set: dto },
          { new: true, runValidators: true },
        )
        .select('-__v')
        .lean();
      if (!updated) throw new NotFoundException('User not found');
      return updated;
    } catch (error) {
      console.log('🚀 ~ UsersService ~ updatePreferences ~ error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error updating preferences',
        developerMessage: error?.message,
      });
    }
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    try {
      const updated = await this.userModel
        .findOneAndUpdate(
          { _id: userId, isDeleted: false },
          { $set: dto },
          { new: true, runValidators: true },
        )
        .select('-__v')
        .lean();
      if (!updated) throw new NotFoundException('User not found');
      return updated;
    } catch (error) {
      console.log('🚀 ~ UsersService ~ updateProfile ~ error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error updating profile',
        developerMessage: error?.message,
      });
    }
  }
}
