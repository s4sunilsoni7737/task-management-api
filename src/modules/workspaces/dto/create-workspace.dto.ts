import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Dexter', required: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/workspaces/dexter.png' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
