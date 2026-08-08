import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Theme } from 'src/enums/theme.enum';
import { ColorMode } from 'src/enums/color-mode.enum';

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
