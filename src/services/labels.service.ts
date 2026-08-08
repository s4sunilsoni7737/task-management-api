import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LabelCollectionName, LabelEntity } from 'src/entities/label.entity';
import { CreateLabelDto } from 'src/dto/create-label.dto';
import { UpdateLabelDto } from 'src/dto/update-label.dto';
import { WorkspacesService } from 'src/services/workspaces.service';

@Injectable()
export class LabelsService {
  constructor(
    @InjectModel(LabelCollectionName) private readonly labelModel: Model<LabelEntity>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getAll(workspaceId: string, userId: string) {
    try {
      await this.workspacesService.assertUserIsMember(workspaceId, userId);
      const list = await this.labelModel
        .find({ workspaceId, isDeleted: false })
        .sort({ name: 1 })
        .select('-__v')
        .lean();
      return list;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error fetching labels',
        developerMessage: error?.message,
      });
    }
  }

  async create(dto: CreateLabelDto, userId: string) {
    try {
      await this.workspacesService.assertUserIsMember(dto.workspaceId, userId);
      const exists = await this.labelModel.exists({
        workspaceId: dto.workspaceId,
        name: dto.name,
        isDeleted: false,
      });
      if (exists)
        throw new ConflictException('A label with this name already exists in this workspace');

      return await this.labelModel.create(dto);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error.code === 11000)
        throw new ConflictException('A label with this name already exists');
      throw new BadRequestException({
        userMessage: 'Error creating label',
        developerMessage: error?.message,
      });
    }
  }

  async update(id: string, dto: UpdateLabelDto) {
    try {
      const updated = await this.labelModel
        .findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: dto },
          { new: true, runValidators: true },
        )
        .select('-__v');
      if (!updated) throw new NotFoundException('Label not found');
      return updated;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error.code === 11000)
        throw new ConflictException('A label with this name already exists');
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
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error deleting label',
        developerMessage: error?.message,
      });
    }
  }
}