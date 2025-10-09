import { Injectable, NotFoundException } from '@nestjs/common';
import { CheckoutsRepository } from './checkouts.repository';
import { QueryCheckoutDto } from './dto/query-checkout.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Injectable()
export class CheckoutsService {
  constructor(private readonly checkoutsRepository: CheckoutsRepository) {}

  async findAll(query: QueryCheckoutDto) {
    const {
      status,
      userId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.paymentStatus = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const total = await this.checkoutsRepository.count(where);

    const checkouts = await this.checkoutsRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      message: 'Checkouts retrieved successfully',
      data: {
        checkouts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findOne(id: number) {
    const checkout = await this.checkoutsRepository.findById(id);

    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    return {
      message: 'Checkout retrieved successfully',
      data: checkout,
    };
  }

  async updatePaymentStatus(
    id: number,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
  ) {
    const checkout = await this.checkoutsRepository.findById(id);

    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    const updatedCheckout = await this.checkoutsRepository.updatePaymentStatus(
      id,
      updatePaymentStatusDto.paymentStatus,
    );

    return {
      message: 'Payment status updated successfully',
      data: updatedCheckout,
    };
  }

  async getStats() {
    const stats = await this.checkoutsRepository.getCheckoutStats();

    return {
      message: 'Checkout statistics retrieved successfully',
      data: stats,
    };
  }
}
