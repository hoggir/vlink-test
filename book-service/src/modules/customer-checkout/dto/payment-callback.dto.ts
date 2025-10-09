import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum PaymentCallbackStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

export class PaymentCallbackDto {
  @ApiProperty({
    description: 'Checkout Reference Number',
    example: 'CHK-20251009143025-A7B3F9',
  })
  @IsNotEmpty()
  @IsString()
  checkoutReferenceNumber: string;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentCallbackStatus,
    example: PaymentCallbackStatus.SUCCESS,
  })
  @IsNotEmpty()
  @IsEnum(PaymentCallbackStatus)
  status: PaymentCallbackStatus;

  @ApiProperty({
    description: 'Payment gateway reference number',
    example: 'PAY-1234567890',
  })
  @IsNotEmpty()
  @IsString()
  paymentReferenceNumber: string;
}
