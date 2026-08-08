import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsPositive, IsString } from 'class-validator'

export class QueryParamsDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsInt()
  @Type(() => Number)
  @IsPositive()
  @IsOptional()
  page?: number

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsInt()
  @Type(() => Number)
  @IsPositive()
  @IsOptional()
  limit?: number

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc'

  @ApiPropertyOptional({ example: 'text' })
  @IsString()
  @IsOptional()
  search?: string
}