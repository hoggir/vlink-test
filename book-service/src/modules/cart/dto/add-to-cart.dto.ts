import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    description: 'Encrypted Book ID',
    example: '4a3f9c8b2e1d6a5f8c7b9a3e2f1d6c5b',
  })
  @IsNotEmpty()
  @IsString()
  bookId: string;

  @ApiProperty({
    description: 'Quantity to add',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}
