import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaskPriority } from 'src/enums/task-priority.enum';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Website Redesign' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'Full revamp of the marketing site' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '66b8f1a2c4d5e6f789001122' })
  @IsOptional()
  @IsMongoId()
  leadId?: string;

  @ApiPropertyOptional({ example: '2026-09-30T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
