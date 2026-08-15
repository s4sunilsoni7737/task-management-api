import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskListQueryDto } from '../dto/task-list-query.dto';
import { CreateSubtaskDto } from '../dto/create-subtask.dto';
import { AddTaskResourceDto } from '../dto/add-task-resource.dto';
import { CommentsService } from '../services/comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { ActivityService } from '../services/activity.service';
import { ActivityType } from '../enums/activity-type.enum';

const TASK_ID_PARAM = {
  name: 'id',
  description: 'Task ID',
  type: 'string',
  format: 'mongodb ObjectId',
} as const;

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly commentsService: CommentsService,
    private readonly activityService: ActivityService,
  ) {}

  // ── Tasks ────────────────────────────────────────────────────────────

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  async getAll(@Query() query: TaskListQueryDto, @CurrentUser('userId') userId: string) {
    const result = await this.tasksService.getAll(query, userId);
    return {
      success: true,
      userMessage: 'Tasks fetched successfully',
      developerMessage: 'Task list fetched',
      data: result,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  async getOne(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task id');
    const result = await this.tasksService.getOne(id, userId);
    return {
      success: true,
      userMessage: 'Task fetched successfully',
      developerMessage: 'Task detail fetched',
      data: result,
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiBody({ type: CreateTaskDto })
  async create(@Body() body: CreateTaskDto, @CurrentUser('userId') userId: string) {
    const result = await this.tasksService.create(body, userId);
    return {
      success: true,
      userMessage: 'Task created successfully',
      developerMessage: 'Task created',
      data: result,
    };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  @ApiBody({ type: UpdateTaskDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task id');
    const result = await this.tasksService.update(id, body, userId);
    return {
      success: true,
      userMessage: 'Task updated successfully',
      developerMessage: 'Task updated',
      data: result,
    };
  }

  @Post(':id/resources')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  @ApiBody({ type: AddTaskResourceDto })
  async addResource(
    @Param('id') id: string,
    @Body() body: AddTaskResourceDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task id');
    const result = await this.tasksService.addResource(id, body, userId);
    return {
      success: true,
      userMessage: 'Resource attached successfully',
      developerMessage: 'Task resource added',
      data: result,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  async remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task id');
    await this.tasksService.remove(id, userId);
    return {
      success: true,
      userMessage: 'Task deleted successfully',
      developerMessage: 'Task soft-deleted',
      data: {},
    };
  }

  @Post(':id/watch')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  async watch(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task id');
    const result = await this.tasksService.toggleWatch(id, userId, true);
    return {
      success: true,
      userMessage: 'You are now watching this task',
      developerMessage: 'Watcher added',
      data: result,
    };
  }

  @Delete(':id/watch')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  async unwatch(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task id');
    const result = await this.tasksService.toggleWatch(id, userId, false);
    return {
      success: true,
      userMessage: 'You stopped watching this task',
      developerMessage: 'Watcher removed',
      data: result,
    };
  }

  // ── Subtasks ─────────────────────────────────────────────────────────

  @Get(':id/subtasks')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  async getSubtasks(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task id');
    const result = await this.tasksService.getSubtasks(id, userId);
    return {
      success: true,
      userMessage: 'Subtasks fetched successfully',
      developerMessage: 'Subtask list fetched',
      data: result,
    };
  }

  @Post(':id/subtasks')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  @ApiBody({ type: CreateSubtaskDto })
  async createSubtask(
    @Param('id') id: string,
    @Body() body: CreateSubtaskDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task id');
    const result = await this.tasksService.createSubtask(id, body, userId);
    return {
      success: true,
      userMessage: 'Subtask created successfully',
      developerMessage: 'Subtask created',
      data: result,
    };
  }

  // ── Comments ─────────────────────────────────────────────────────────

  @Get(':id/comments')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  async getComments(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task id');
    await this.tasksService.assertAccessAndGet(id, userId);
    const result = await this.commentsService.getForTask(id);
    return {
      success: true,
      userMessage: 'Comments fetched successfully',
      developerMessage: 'Comment thread fetched',
      data: result,
    };
  }

  @Post(':id/comments')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  @ApiBody({ type: CreateCommentDto })
  async addComment(
    @Param('id') id: string,
    @Body() body: CreateCommentDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task id');
    await this.tasksService.assertAccessAndGet(id, userId);
    const result = await this.commentsService.create(id, userId, body);

    await this.activityService.record({
      taskId: id,
      actorId: userId,
      type: ActivityType.COMMENT,
      message: 'You posted an update',
    });

    return {
      success: true,
      userMessage: 'Comment posted successfully',
      developerMessage: 'Comment created',
      data: result,
    };
  }

  @Patch(':id/comments/:commentId')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  @ApiParam({
    name: 'commentId',
    description: 'Comment ID',
    type: 'string',
    format: 'mongodb ObjectId',
  })
  @ApiBody({ type: UpdateCommentDto })
  async updateComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() body: UpdateCommentDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Invalid id');
    }
    await this.tasksService.assertAccessAndGet(id, userId);
    const result = await this.commentsService.update(commentId, userId, body);
    return {
      success: true,
      userMessage: 'Comment updated successfully',
      developerMessage: 'Comment updated',
      data: result,
    };
  }

  @Delete(':id/comments/:commentId')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  @ApiParam({
    name: 'commentId',
    description: 'Comment ID',
    type: 'string',
    format: 'mongodb ObjectId',
  })
  async removeComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @CurrentUser('userId') userId: string,
  ) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Invalid id');
    }
    await this.tasksService.assertAccessAndGet(id, userId);
    await this.commentsService.remove(commentId, userId);
    return {
      success: true,
      userMessage: 'Comment deleted successfully',
      developerMessage: 'Comment soft-deleted',
      data: {},
    };
  }

  // ── Activity ─────────────────────────────────────────────────────────

  @Get(':id/activity')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam(TASK_ID_PARAM)
  async getActivity(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task id');
    await this.tasksService.assertAccessAndGet(id, userId);
    const result = await this.activityService.getForTask(id);
    return {
      success: true,
      userMessage: 'Activity log fetched successfully',
      developerMessage: 'Updates/activity log fetched',
      data: result,
    };
  }
}
