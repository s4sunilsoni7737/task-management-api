import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { QueryParamsDto } from 'src/common/dto/queryParams.dto';

export class ProjectListQueryDto extends QueryParamsDto {
  @ApiPropertyOptional({ example: '66b8f1a2c4d5e6f789001199', required: true })
  @IsMongoId()
  @IsNotEmpty()
  workspaceId: string;

  @ApiPropertyOptional({ example: 'redesign' })
  @IsOptional()
  @IsString()
  search?: string;
}