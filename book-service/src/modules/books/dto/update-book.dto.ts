import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBookDto extends PartialType(CreateBookDto) {}

export class UpdateStockDto {
  @ApiProperty({
    description: 'New stock quantity',
    example: 50,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;
}
