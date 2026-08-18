import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserCollectionName, UserEntity } from '../entities/user.entity';
import { WorkspaceCollectionName, WorkspaceEntity } from '../entities/workspace.entity';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { UpdateWorkspaceDto } from '../dto/update-workspace.dto';
import { ProjectEntity } from '../entities/project.entity';
import { TaskEntity } from '../entities/task.entity';
import { LabelEntity } from '../entities/label.entity';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(WorkspaceEntity.name) private readonly workspaceModel: Model<WorkspaceEntity>,
    @InjectModel(UserEntity.name) private readonly userModel: Model<UserEntity>,
    @InjectModel(ProjectEntity.name) private readonly projectModel: Model<ProjectEntity>,
    @InjectModel(TaskEntity.name) private readonly taskModel: Model<TaskEntity>,
    @InjectModel(LabelEntity.name) private readonly labelModel: Model<LabelEntity>,
  ) {}

  /**
   * Resolves the effective workspace ID for a user. If an explicit
   * workspaceId is provided it must be one the user is a member of;
   * otherwise the user's defaultWorkspaceId is used (matching the
   * frontend's contract of calling list endpoints without workspaceId).
   */
  async resolveWorkspaceId(workspaceId: string | undefined, userId: string): Promise<string> {
    if (workspaceId) {
      await this.assertUserIsMember(workspaceId, userId);
      return workspaceId;
    }

    const user = await this.userModel.findOne({ _id: userId, isDeleted: false }).lean();
    if (!user) throw new NotFoundException('User not found');

    if (user.workspaceId) {
      const resolved = user.workspaceId.toString();
      try {
        await this.assertUserIsMember(resolved, userId);
        return resolved;
      } catch (error) {
        // If the user lost access to their workspace (e.g., removed or deleted), fall through and find another one
      }
    }

    // Fallback: find any workspace the user is a member of
    const firstAvailable = await this.workspaceModel
      .findOne({
        memberIds: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .lean();

    if (!firstAvailable) {
      throw new BadRequestException('You do not belong to any workspaces');
    }

    return firstAvailable._id.toString();
  }

  /**
   * Creates the default "personal" workspace for a newly registered user
   * (guest or Google) and adds them as both owner and member.
   */
  async createDefaultForUser(userId: Types.ObjectId, name = 'Dexter'): Promise<WorkspaceEntity> {
    try {
      const created = await this.workspaceModel.create({
        name,
        ownerId: userId,
        memberIds: [userId],
      });
      return created;
    } catch (error) {
      console.log('🚀 ~ WorkspacesService ~ createDefaultForUser ~ error:', error);
      throw new BadRequestException({
        userMessage: 'Unable to create default workspace',
        developerMessage: error?.message,
      });
    }
  }

  async listForUser(userId: string) {
    try {
      return await this.workspaceModel
        .find({ memberIds: new Types.ObjectId(userId), isDeleted: false })
        .sort({ createdAt: -1 })
        .select('-__v')
        .lean();
    } catch (error) {
      console.log('🚀 ~ WorkspacesService ~ listForUser ~ error:', error);
      throw new BadRequestException({
        userMessage: 'Error fetching workspaces',
        developerMessage: error?.message,
      });
    }
  }

  async getOne(id: string, userId: string) {
    try {
      const workspace = await this.workspaceModel
        .findOne({ _id: id, isDeleted: false })
        .select('-__v')
        .lean();
      if (!workspace) throw new NotFoundException('Workspace not found');
      this._assertMember(workspace, userId);
      return workspace;
    } catch (error) {
      console.log('🚀 ~ WorkspacesService ~ getOne ~ error:', error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error fetching workspace',
        developerMessage: error?.message,
      });
    }
  }

  async create(dto: CreateWorkspaceDto, userId: string) {
    try {
      const created = await this.workspaceModel.create({
        ...dto,
        ownerId: new Types.ObjectId(userId),
        memberIds: [new Types.ObjectId(userId)],
      });
      return created;
    } catch (error) {
      console.log('🚀 ~ WorkspacesService ~ create ~ error:', error);
      throw new BadRequestException({
        userMessage: 'Error creating workspace',
        developerMessage: error?.message,
      });
    }
  }

  async update(id: string, dto: UpdateWorkspaceDto, userId: string) {
    try {
      const workspace = await this.workspaceModel.findOne({ _id: id, isDeleted: false });
      if (!workspace) throw new NotFoundException('Workspace not found');
      this._assertOwner(workspace, userId);

      const updated = await this.workspaceModel
        .findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: dto },
          { new: true, runValidators: true },
        )
        .select('-__v')
        .lean();

      return updated;
    } catch (error) {
      console.log('🚀 ~ WorkspacesService ~ update ~ error:', error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error updating workspace',
        developerMessage: error?.message,
      });
    }
  }

  async addMember(id: string, memberUserId: string, requesterId: string) {
    try {
      const workspace = await this.workspaceModel.findOne({ _id: id, isDeleted: false });
      if (!workspace) throw new NotFoundException('Workspace not found');
      this._assertMember(workspace, requesterId);

      const memberObjectId = new Types.ObjectId(memberUserId);
      const alreadyMember = workspace.memberIds.some((m) => m.equals(memberObjectId));
      if (!alreadyMember) {
        const updated = await this.workspaceModel
          .findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $addToSet: { memberIds: memberObjectId } },
            { new: true, runValidators: true },
          )
          .select('-__v')
          .lean();
        return updated;
      }
      return workspace;
    } catch (error) {
      console.log('🚀 ~ WorkspacesService ~ addMember ~ error:', error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error adding member',
        developerMessage: error?.message,
      });
    }
  }

  async remove(id: string, userId: string) {
    try {
      const workspace = await this.workspaceModel.findOne({ _id: id, isDeleted: false });
      if (!workspace) throw new NotFoundException('Workspace not found');
      this._assertOwner(workspace, userId);

      const deleted = await this.workspaceModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true },
      );
      if (!deleted) throw new NotFoundException('Workspace not found');

      const workspaceObjId = new Types.ObjectId(id);
      await Promise.all([
        this.projectModel.updateMany(
          { workspaceId: workspaceObjId, isDeleted: false },
          { $set: { isDeleted: true, deletedAt: new Date() } }
        ),
        this.taskModel.updateMany(
          { workspaceId: workspaceObjId, isDeleted: false },
          { $set: { isDeleted: true, deletedAt: new Date() } }
        ),
        this.labelModel.updateMany(
          { workspaceId: workspaceObjId, isDeleted: false },
          { $set: { isDeleted: true, deletedAt: new Date() } }
        )
      ]);

      return true;
    } catch (error) {
      console.log('🚀 ~ WorkspacesService ~ remove ~ error:', error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error deleting workspace',
        developerMessage: error?.message,
      });
    }
  }

  /** Verifies the given workspace exists, is not deleted, and userId is a member. Used by other modules (Projects/Tasks/Labels) to authorize access. */
  async assertUserIsMember(workspaceId: string, userId: string) {
    const workspace = await this.workspaceModel
      .findOne({ _id: workspaceId, isDeleted: false })
      .lean();
    if (!workspace) throw new NotFoundException('Workspace not found');
    const isMember = workspace.memberIds.some((m) => m.toString() === userId);
    if (!isMember) throw new ForbiddenException('You are not a member of this workspace');
    return workspace;
  }

  private _assertMember(workspace: WorkspaceEntity | any, userId: string) {
    const isMember = workspace.memberIds.some((m: Types.ObjectId) => m.toString() === userId);
    if (!isMember) throw new ForbiddenException('You are not a member of this workspace');
  }

  private _assertOwner(workspace: WorkspaceEntity, userId: string) {
    if (workspace.ownerId.toString() !== userId) {
      throw new ForbiddenException('Only the workspace owner can perform this action');
    }
  }
}
