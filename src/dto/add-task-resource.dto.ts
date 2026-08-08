import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AddTaskResourceDto {
  @ApiProperty({ example: 'Design spec.pdf', required: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://drive.google.com/file/d/abc123', required: true })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}
