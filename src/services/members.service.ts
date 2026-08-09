import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserCollectionName, UserEntity } from '../entities/user.entity';
import { WorkspaceCollectionName, WorkspaceEntity } from '../entities/workspace.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(UserEntity.name) private readonly userModel: Model<UserEntity>,
    @InjectModel(WorkspaceEntity.name) private readonly workspaceModel: Model<WorkspaceEntity>,
  ) {}

  /**
   * Returns all users who are members of the authenticated user's default
   * workspace — powering the member pickers (assignees, reporter, lead).
   */
  async getAllForUser(userId: string) {
    try {
      const user = await this.userModel.findOne({ _id: userId, isDeleted: false }).lean();
      if (!user) throw new NotFoundException('User not found');

      const workspaceId = user.defaultWorkspaceId?.toString();
      if (!workspaceId) return [];

      const workspace = await this.workspaceModel
        .findOne({ _id: workspaceId, isDeleted: false })
        .lean();
      if (!workspace) return [];

      const memberIds = workspace.memberIds.map((id) => id.toString());
      const validIds = memberIds.filter((id) => Types.ObjectId.isValid(id));

      const members = await this.userModel
        .find({ _id: { $in: validIds }, isDeleted: false })
        .select('_id name email avatarUrl isGuest')
        .lean();

      return members.map((m) => ({
        id: m._id.toString(),
        name: m.name ?? 'Unnamed',
        email: m.email ?? '',
        avatarUrl: m.avatarUrl ?? null,
        role: m.isGuest ? 'guest' : 'member',
      }));
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        userMessage: 'Error fetching members',
        developerMessage: error?.message,
      });
    }
  }
}