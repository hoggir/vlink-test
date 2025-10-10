import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { CartService } from '../cart/cart.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentStatus } from '@prisma/client';
import { encryptId } from '../../common/utils/crypto.util';
import { generateReferenceNumber } from '../../common/utils/reference.util';

@Injectable()
export class CustomerCheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    @InjectQueue('payment') private readonly paymentQueue: Queue,
  ) {}

  async createCheckout(userId: number, createCheckoutDto: CreateCheckoutDto) {
    const cart = await this.cartService.getCartForCheckout(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const bookIds = cart.items.map((item) => item.bookId);

        const books = await tx.$queryRaw<
          Array<{
            id: number;
            title: string;
            stock: number;
            price: any;
            isDeleted: boolean;
          }>
        >`
          SELECT id, title, stock, price, "isDeleted"
          FROM books
          WHERE id = ANY(${bookIds}::int[])
          FOR UPDATE
        `;

        const bookMap = new Map(books.map((book) => [book.id, book]));

        for (const cartItem of cart.items) {
          const book = bookMap.get(cartItem.bookId);

          if (!book || book.isDeleted) {
            throw new BadRequestException(
              `Book "${cartItem.title}" is no longer available`,
            );
          }

          if (book.stock < cartItem.quantity) {
            throw new BadRequestException(
              `Insufficient stock for "${cartItem.title}". Available: ${book.stock}, Requested: ${cartItem.quantity}`,
            );
          }

          if (Number(book.price) !== cartItem.price) {
            throw new BadRequestException(
              `Price has changed for "${cartItem.title}". Please refresh your cart.`,
            );
          }
        }

        const referenceNumber = generateReferenceNumber();

        const checkout = await tx.checkout.create({
          data: {
            userId,
            referenceNumber,
            totalAmount: cart.totalAmount,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: createCheckoutDto.paymentMethod,
          },
        });

        for (const cartItem of cart.items) {
          await tx.checkoutItem.create({
            data: {
              checkoutId: checkout.id,
              bookId: cartItem.bookId,
              quantity: cartItem.quantity,
              price: cartItem.price,
              subtotal: cartItem.subtotal,
            },
          });

          await tx.book.update({
            where: { id: cartItem.bookId },
            data: {
              stock: {
                decrement: cartItem.quantity,
              },
              soldCount: {
                increment: cartItem.quantity,
              },
            },
          });
        }

        const fullCheckout = await tx.checkout.findUnique({
          where: { id: checkout.id },
          include: {
            items: {
              include: {
                book: {
                  select: {
                    id: true,
                    title: true,
                    author: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return fullCheckout;
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: 'Serializable',
      },
    );

    if (!result) {
      throw new InternalServerErrorException('Failed to create checkout');
    }

    await this.cartService.clearCart(userId);

    const encryptedCheckout = {
      ...result,
      id: encryptId(result.id),
      userId: encryptId(result.userId),
      items:
        result.items?.map((item) => ({
          ...item,
          id: encryptId(item.id),
          checkoutId: encryptId(item.checkoutId),
          bookId: encryptId(item.bookId),
          book: {
            ...item.book,
            id: encryptId(item.book.id),
          },
        })) || [],
      user: result.user
        ? {
            ...result.user,
            id: encryptId(result.user.id),
          }
        : null,
    };

    return {
      message: 'Checkout created successfully. Please proceed with payment.',
      data: encryptedCheckout,
    };
  }

  async getUserCheckouts(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [checkouts, total] = await Promise.all([
      this.prisma.checkout.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  author: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.checkout.count({ where: { userId } }),
    ]);

    const encryptedCheckouts = checkouts.map((checkout) => ({
      ...checkout,
      id: encryptId(checkout.id),
      userId: encryptId(checkout.userId),
      items: checkout.items.map((item) => ({
        ...item,
        id: encryptId(item.id),
        checkoutId: encryptId(item.checkoutId),
        bookId: encryptId(item.bookId),
        book: {
          ...item.book,
          id: encryptId(item.book.id),
        },
      })),
    }));

    return {
      message: 'Checkouts retrieved successfully',
      data: {
        checkouts: encryptedCheckouts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getCheckoutDetail(userId: number, checkoutId: number) {
    const checkout = await this.prisma.checkout.findFirst({
      where: {
        id: checkoutId,
        userId,
      },
      include: {
        items: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
              },
            },
          },
        },
      },
    });

    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    const encryptedCheckout = {
      ...checkout,
      id: encryptId(checkout.id),
      userId: encryptId(checkout.userId),
      items: checkout.items.map((item) => ({
        ...item,
        id: encryptId(item.id),
        checkoutId: encryptId(item.checkoutId),
        bookId: encryptId(item.bookId),
        book: {
          ...item.book,
          id: encryptId(item.book.id),
        },
      })),
    };

    return {
      message: 'Checkout detail retrieved successfully',
      data: encryptedCheckout,
    };
  }

  async processPaymentCallback(
    checkoutReferenceNumber: string,
    status: 'success' | 'failed' | 'pending',
    paymentReferenceNumber: string,
  ) {
    const checkout = await this.prisma.checkout.findUnique({
      where: { referenceNumber: checkoutReferenceNumber },
      include: {
        items: true,
      },
    });

    if (!checkout) {
      throw new NotFoundException(
        `Checkout not found with reference: ${checkoutReferenceNumber}`,
      );
    }

    if (status === 'failed') {
      await this.prisma.$transaction(async (tx) => {
        for (const item of checkout.items) {
          await tx.book.update({
            where: { id: item.bookId },
            data: {
              stock: {
                increment: item.quantity,
              },
              soldCount: {
                decrement: item.quantity,
              },
            },
          });
        }

        await tx.checkout.update({
          where: { id: checkout.id },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            paymentReferenceNumber,
          },
        });
      });

      return {
        message: 'Payment failed. Stock has been restored.',
        status: 'failed',
        referenceNumber: checkoutReferenceNumber,
      };
    }

    const newStatus =
      status === 'success'
        ? PaymentStatus.PAID
        : status === 'pending'
          ? PaymentStatus.PENDING
          : PaymentStatus.FAILED;

    await this.prisma.checkout.update({
      where: { id: checkout.id },
      data: {
        paymentStatus: newStatus,
        paymentReferenceNumber,
      },
    });

    return {
      message: `Payment ${status}`,
      status,
      referenceNumber: checkoutReferenceNumber,
      paymentReference: paymentReferenceNumber,
    };
  }
}
