import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommentCollectionName, CommentEntity } from 'src/entities/comment.entity';
import { CreateCommentDto } from 'src/dto/create-comment.dto';
import { UpdateCommentDto } from 'src/dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(CommentCollectionName) private readonly commentModel: Model<CommentEntity>,
  ) {}

  async getForTask(taskId: string) {
    try {
      const list = await this.commentModel
        .find({ taskId, isDeleted: false })
        .sort({ createdAt: 1 })
        .select('-__v')
        .lean();
      return list;
    } catch (error: any) {
      throw new BadRequestException({
        userMessage: 'Error fetching comments',
        developerMessage: error?.message,
      });
    }
  }

  async create(taskId: string, authorId: string, dto: CreateCommentDto) {
    try {
      return await this.commentModel.create({
        taskId,
        authorId,
        body: dto.body,
        attachments: dto.attachments ?? [],
      });
    } catch (error: any) {
      throw new BadRequestException({
        userMessage: 'Error posting comment',
        developerMessage: error?.message,
      });
    }
  }

  async update(commentId: string, authorId: string, dto: UpdateCommentDto) {
    try {
      const comment = await this.commentModel.findOne({ _id: commentId, isDeleted: false });
      if (!comment) throw new NotFoundException('Comment not found');
      if (comment.authorId.toString() !== authorId) {
        throw new ForbiddenException('You can only edit your own comments');
      }

      const updated = await this.commentModel.findOneAndUpdate(
        { _id: commentId, isDeleted: false },
        { $set: { body: dto.body } },
        { new: true, runValidators: true },
      );
      return updated;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error updating comment',
        developerMessage: error?.message,
      });
    }
  }

  async remove(commentId: string, authorId: string) {
    try {
      const comment = await this.commentModel.findOne({ _id: commentId, isDeleted: false });
      if (!comment) throw new NotFoundException('Comment not found');
      if (comment.authorId.toString() !== authorId) {
        throw new ForbiddenException('You can only delete your own comments');
      }

      const deleted = await this.commentModel.findOneAndUpdate(
        { _id: commentId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true },
      );
      if (!deleted) throw new NotFoundException('Comment not found');
      return true;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error deleting comment',
        developerMessage: error?.message,
      });
    }
  }
}