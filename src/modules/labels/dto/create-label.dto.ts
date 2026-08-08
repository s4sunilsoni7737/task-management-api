import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLabelDto {
  @ApiProperty({ example: '66b8f1a2c4d5e6f789001199', required: true })
  @IsMongoId()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({ example: 'Design', required: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional({ example: '#F59E0B' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
