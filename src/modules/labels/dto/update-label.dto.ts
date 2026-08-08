import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLabelDto {
  @ApiPropertyOptional({ example: 'Design' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ example: '#F59E0B' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
