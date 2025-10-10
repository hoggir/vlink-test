import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateCheckoutDto {
  @ApiProperty({
    description: 'Payment method - must be selected when creating checkout',
    enum: PaymentMethod,
    example: 'CREDIT_CARD',
    required: true,
  })
  @IsEnum(PaymentMethod, {
    message: 'Payment method must be one of: CREDIT_CARD, BANK_TRANSFER, E_WALLET, CASH'
  })
  paymentMethod: PaymentMethod;
}
