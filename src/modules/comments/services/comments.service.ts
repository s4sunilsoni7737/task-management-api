import { BadRequestException, ForbiddenException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommentDocument, CommentEntity } from '../entities/comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(CommentEntity.name) private readonly commentModel: Model<CommentDocument>,
  ) {}

  async getForTask(taskId: string) {
    try {
      const list = await this.commentModel
        .find({ taskId, isDeleted: false })
        .sort({ createdAt: 1 })
        .select('-__v')
        .lean();
      return list;
    } catch (error) {
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
    } catch (error) {
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
      comment.body = dto.body;
      await comment.save();
      return comment;
    } catch (error) {
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
      comment.isDeleted = true;
      comment.deletedAt = new Date();
      await comment.save();
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        userMessage: 'Error deleting comment',
        developerMessage: error?.message,
      });
    }
  }
}
