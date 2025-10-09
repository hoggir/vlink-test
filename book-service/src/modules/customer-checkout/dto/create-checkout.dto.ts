import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({
    description: 'Payment method (optional)',
    example: 'CREDIT_CARD',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
