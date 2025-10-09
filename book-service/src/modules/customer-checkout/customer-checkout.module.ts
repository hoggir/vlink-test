import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CustomerCheckoutController } from './customer-checkout.controller';
import { CustomerCheckoutService } from './customer-checkout.service';
import { PaymentProcessor } from './processors/payment.processor';
import { CartModule } from '../cart/cart.module';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'payment',
    }),
    CartModule,
  ],
  controllers: [CustomerCheckoutController],
  providers: [CustomerCheckoutService, PaymentProcessor, PrismaService],
  exports: [CustomerCheckoutService],
})
export class CustomerCheckoutModule {}
