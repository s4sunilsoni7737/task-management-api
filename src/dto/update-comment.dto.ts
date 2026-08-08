import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Looks great, ship it! (edited)', required: true })
  @IsString()
  @IsNotEmpty()
  body: string;
}
