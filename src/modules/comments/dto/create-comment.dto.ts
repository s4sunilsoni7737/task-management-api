import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CommentAttachmentDto {
  @ApiProperty({ example: 'screenshot.png' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://cdn.example.com/uploads/screenshot.png' })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Looks great, ship it!', required: true })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ type: [CommentAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommentAttachmentDto)
  attachments?: CommentAttachmentDto[];
}
