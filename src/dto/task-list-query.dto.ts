import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { QueryParamsDto } from 'src/common/dto/queryParams.dto';
import { TaskPriority } from 'src/enums/task-priority.enum';
import { TaskStatus } from 'src/enums/task-status.enum';

export class TaskListQueryDto extends QueryParamsDto {
  @ApiPropertyOptional({ example: '66b8f1a2c4d5e6f789001199', required: true })
  @IsMongoId()
  @IsNotEmpty()
  workspaceId: string;

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

  @ApiPropertyOptional({
    example: true,
    description: 'When true (default), only return top-level tasks (excludes subtasks).',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (typeof value === 'string' ? value !== 'false' : value))
  topLevelOnly?: boolean = true;

  @ApiPropertyOptional({
    example: false,
    description:
      "When true, ignores pagination and returns tasks grouped into an object keyed by Status — matches the List view's collapsible Status sections and the Board view's Kanban columns.",
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (typeof value === 'string' ? value === 'true' : value))
  groupByStatus?: boolean = false;

  @ApiPropertyOptional({
    example: 'hero section',
    description: 'Free-text search across title/description',
  })
  @IsOptional()
  @IsString()
  q?: string;
}