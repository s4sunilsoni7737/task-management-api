import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { QueryParamsDto } from '../common/dto/queryParams.dto';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

export class TaskListQueryDto extends QueryParamsDto {
  @ApiPropertyOptional({ example: '66b8f1a2c4d5e6f789001199' })
  @IsOptional()
  @IsMongoId()
  workspaceId?: string;

  @ApiPropertyOptional({ example: '66b8f1a2c4d5e6f789001188' })
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    example: '66b8f1a2c4d5e6f789001122',
    description: 'Filter by assigned member',
  })
  @IsOptional()
  @IsMongoId()
  memberId?: string;

  @ApiPropertyOptional({ example: '66b8f1a2c4d5e6f789001177', description: 'Filter by label' })
  @IsOptional()
  @IsMongoId()
  labelId?: string;

  @ApiPropertyOptional({ description: 'Filter by reporter user id' })
  @IsOptional()
  @IsMongoId()
  reporterId?: string;

  @ApiPropertyOptional({ description: 'Filter by team string' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({ description: 'Predefined due date filters e.g. "overdue", "today", "this_week"' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'When true (default), only return top-level tasks (excludes subtasks).',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
  topLevelOnly?: boolean = true;

  @ApiPropertyOptional({
    example: false,
    description:
      "When true, ignores pagination and returns tasks grouped into an object keyed by Status — matches the List view's collapsible Status sections and the Board view's Kanban columns.",
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
  groupByStatus?: boolean = false;

  @ApiPropertyOptional({
    example: 'hero section',
    description: 'Free-text search across title/description',
  })
  @IsOptional()
  @IsString()
  q?: string;
}