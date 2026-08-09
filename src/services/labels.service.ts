import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LabelCollectionName, LabelEntity } from '../entities/label.entity';
import { CreateLabelDto } from '../dto/create-label.dto';
import { UpdateLabelDto } from '../dto/update-label.dto';
import { WorkspacesService } from './workspaces.service';

@Injectable()
export class LabelsService {
  constructor(
    @InjectModel(LabelEntity.name) private readonly labelModel: Model<LabelEntity>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getAll(workspaceId: string | undefined, userId: string) {
    try {
      const resolvedWorkspaceId = await this.workspacesService.resolveWorkspaceId(
        workspaceId,
        userId,
      );

      return await this.labelModel
        .find({ workspaceId: resolvedWorkspaceId, isDeleted: false })
        .sort({ name: 1 })
        .select('-__v')
        .lean();
    } catch (error) {
      console.log('🚀 ~ LabelsService ~ getAll ~ error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException({
        userMessage: 'Error fetching labels',
        developerMessage: error?.message,
      });
    }
  }

  async create(dto: CreateLabelDto, userId: string) {
    try {
      const workspaceId = await this.workspacesService.resolveWorkspaceId(dto.workspaceId, userId);
      const exists = await this.labelModel.exists({
        workspaceId,
        name: dto.name,
        isDeleted: false,
      });
      if (exists)
        throw new ConflictException('A label with this name already exists in this workspace');

      const created = await this.labelModel.create({ ...dto, workspaceId });
      
      return created;
    } catch (error) {
      console.log('🚀 ~ LabelsService ~ create ~ error:', error);
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }

      throw new BadRequestException({
        userMessage: 'Error creating label',
        developerMessage: error?.message,
      });
    }
  }

  async update(id: string, dto: UpdateLabelDto) {
    try {
      if (dto.name) {
        const existing = await this.labelModel.findOne({ _id: id, isDeleted: false });
        if (!existing) throw new NotFoundException('Label not found');
        
        if (dto.name !== existing.name) {
          const nameExists = await this.labelModel.exists({
            workspaceId: existing.workspaceId,
            name: dto.name,
            isDeleted: false
          });
          if (nameExists) throw new ConflictException('A label with this name already exists in this workspace');
        }
      }

      const updated = await this.labelModel
        .findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: dto },
          { new: true, runValidators: true },
        )
        .select('-__v')
        .lean();
        
      if (!updated) throw new NotFoundException('Label not found');
      return updated;
    } catch (error) {
      console.log('🚀 ~ LabelsService ~ update ~ error:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      throw new BadRequestException({
        userMessage: 'Error updating label',
        developerMessage: error?.message,
      });
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.labelModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true },
      );
      if (!deleted) throw new NotFoundException('Label not found');
      return true;
    } catch (error) {
      console.log('🚀 ~ LabelsService ~ remove ~ error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        userMessage: 'Error deleting label',
        developerMessage: error?.message,
      });
    }
  }
}