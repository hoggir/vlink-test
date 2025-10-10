import { Checkout as PrismaCheckout, PaymentStatus, PaymentMethod } from '@prisma/client';

export class Checkout implements PrismaCheckout {
  id: number;
  userId: number;
  referenceNumber: string | null;
  paymentReferenceNumber: string | null;
  totalAmount: any;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  createdAt: Date;
  updatedAt: Date;
}
