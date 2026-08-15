import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, IsOptional } from 'class-validator';

export class AddTaskResourceDto {
  @ApiProperty({ example: 'Design spec.pdf', required: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false, description: 'Task resource file' })
  @IsOptional()
  url?: any;
}
