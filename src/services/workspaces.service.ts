import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkspaceDocument, WorkspaceEntity } from 'src/entities/workspace.entity';
import { CreateWorkspaceDto } from 'src/dto/create-workspace.dto';
import { UpdateWorkspaceDto } from 'src/dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(WorkspaceEntity.name) private readonly workspaceModel: Model<WorkspaceDocument>,
  ) {}

  /**
   * Creates the default "personal" workspace for a newly registered user
   * (guest or Google) and adds them as both owner and member.
   */
  async createDefaultForUser(userId: Types.ObjectId, name = 'Dexter'): Promise<WorkspaceDocument> {
    try {
      return await this.workspaceModel.create({
        name,
        ownerId: userId,
        memberIds: [userId],
      });
    } catch (error: any) {
      throw new BadRequestException({
        userMessage: 'Unable to create default workspace',
        developerMessage: error?.message,
      });
    }
  }

  async listForUser(userId: string) {
    try {
      const list = await this.workspaceModel
        .find({ memberIds: userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .select('-__v')
        .lean();
      return list;
    } catch (error: any) {
      throw new BadRequestException({
        userMessage: 'Error fetching workspaces',
        developerMessage: error?.message,
      });
    }
  }

  async getOne(id: string, userId: string) {
    const workspace = await this.workspaceModel
      .findOne({ _id: id, isDeleted: false })
      .select('-__v')
      .lean();
    if (!workspace) throw new NotFoundException('Workspace not found');
    this._assertMember(workspace, userId);
    return workspace;
  }

  async create(dto: CreateWorkspaceDto, userId: string) {
    try {
      const created = await this.workspaceModel.create({
        ...dto,
        ownerId: new Types.ObjectId(userId),
        memberIds: [new Types.ObjectId(userId)],
      });
      return created;
    } catch (error: any) {
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

      Object.assign(workspace, dto);
      await workspace.save();
      return workspace;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
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
        workspace.memberIds.push(memberObjectId);
        await workspace.save();
      }
      return workspace;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
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

      workspace.isDeleted = true;
      workspace.deletedAt = new Date();
      await workspace.save();
      return true;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
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

  private _assertMember(workspace: WorkspaceDocument | any, userId: string) {
    const isMember = workspace.memberIds.some((m: Types.ObjectId) => m.toString() === userId);
    if (!isMember) throw new ForbiddenException('You are not a member of this workspace');
  }

  private _assertOwner(workspace: WorkspaceDocument, userId: string) {
    if (workspace.ownerId.toString() !== userId) {
      throw new ForbiddenException('Only the workspace owner can perform this action');
    }
  }
}
