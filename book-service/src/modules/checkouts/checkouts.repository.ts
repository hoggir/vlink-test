import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, PaymentStatus } from '@prisma/client';

@Injectable()
export class CheckoutsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CheckoutCreateInput) {
    return this.prisma.checkout.create({
      data,
      include: {
        items: {
          include: {
            book: true,
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
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CheckoutWhereInput;
    orderBy?: Prisma.CheckoutOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.checkout.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        items: {
          include: {
            book: true,
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
  }

  async count(where?: Prisma.CheckoutWhereInput) {
    return this.prisma.checkout.count({ where });
  }

  async findById(id: number) {
    return this.prisma.checkout.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            book: true,
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
  }

  async findByUserId(userId: number) {
    return this.prisma.checkout.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            book: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updatePaymentStatus(id: number, paymentStatus: PaymentStatus) {
    return this.prisma.checkout.update({
      where: { id },
      data: { paymentStatus },
      include: {
        items: {
          include: {
            book: true,
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
  }

  async getCheckoutStats() {
    const [totalCheckouts, totalRevenue, statusBreakdown] = await Promise.all([
      this.prisma.checkout.count(),
      this.prisma.checkout.aggregate({
        where: {
          paymentStatus: 'PAID',
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.checkout.groupBy({
        by: ['paymentStatus'],
        _count: {
          paymentStatus: true,
        },
      }),
    ]);

    return {
      totalCheckouts,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      statusBreakdown,
    };
  }
}
