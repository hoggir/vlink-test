import { Checkout as PrismaCheckout, PaymentStatus } from '@prisma/client';

export class Checkout implements PrismaCheckout {
  id: number;
  userId: number;
  referenceNumber: string | null;
  paymentReferenceNumber: string | null;
  totalAmount: any;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}
