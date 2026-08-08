import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ColorMode, Theme } from 'src/common/enums';

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({ enum: Theme, example: Theme.DARK })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @ApiPropertyOptional({ enum: ColorMode, example: ColorMode.AMBER })
  @IsOptional()
  @IsEnum(ColorMode)
  colorMode?: ColorMode;
}
