import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryReportDto {
  @ApiProperty({
    description: 'Search by book title or author',
    required: false,
    example: 'Gatsby',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Page number',
    required: false,
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    required: false,
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description: 'Sort by field (soldCount, stock, revenue)',
    required: false,
    example: 'soldCount',
    default: 'soldCount',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'soldCount';

  @ApiProperty({
    description: 'Sort order (asc or desc)',
    required: false,
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
