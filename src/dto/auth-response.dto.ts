import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ example: '66b8f1a2c4d5e6f789001122' })
  id: string;

  @ApiProperty({ example: 'Jane Doe', nullable: true })
  name: string | null;

  @ApiProperty({ example: 'jane@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: null, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: true })
  isGuest: boolean;

  @ApiProperty({ example: 'light' })
  theme: string;

  @ApiProperty({ example: 'black' })
  colorMode: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT bearer token to send as Authorization: Bearer <token>' })
  accessToken: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;

  @ApiProperty({ description: 'The workspace auto-created/attached for this user' })
  workspace: any;
}
