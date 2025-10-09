import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { CustomerCheckoutService } from '../customer-checkout.service';

export interface PaymentJob {
  checkoutReferenceNumber: string;
  status: 'success' | 'failed' | 'pending';
  paymentReferenceNumber: string;
}

@Processor('payment')
export class PaymentProcessor {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    private readonly customerCheckoutService: CustomerCheckoutService,
  ) {}

  @Process('process-callback')
  async handlePaymentCallback(job: Job<PaymentJob>) {
    this.logger.log(
      `Processing payment callback for checkout ${job.data.checkoutReferenceNumber}`,
    );

    try {
      const result = await this.customerCheckoutService.processPaymentCallback(
        job.data.checkoutReferenceNumber,
        job.data.status,
        job.data.paymentReferenceNumber,
      );

      this.logger.log(
        `Payment callback processed successfully: ${JSON.stringify(result)}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process payment callback: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
