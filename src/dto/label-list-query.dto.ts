import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { QueryParamsDto } from '../common/dto/queryParams.dto';

export class LabelListQueryDto extends QueryParamsDto {
  @ApiPropertyOptional({ example: '66b8f1a2c4d5e6f789001199' })
  @IsOptional()
  @IsMongoId()
  workspaceId?: string;
}
