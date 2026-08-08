import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AddWorkspaceMemberDto {
  @ApiProperty({ example: '66b8f1a2c4d5e6f789001122', required: true })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}
