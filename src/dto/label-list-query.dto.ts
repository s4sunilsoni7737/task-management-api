import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class LabelListQueryDto {
  @ApiPropertyOptional({ example: '66b8f1a2c4d5e6f789001199', required: true })
  @IsMongoId()
  @IsNotEmpty()
  workspaceId: string;
}
