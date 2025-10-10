import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: 'PAID',
  })
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: 'CREDIT_CARD',
    required: false,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}
