import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BookCreateInput) {
    return this.prisma.book.create({
      data,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.BookWhereInput;
    orderBy?: Prisma.BookOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.book.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async count(where?: Prisma.BookWhereInput) {
    return this.prisma.book.count({ where });
  }

  async findById(id: number) {
    return this.prisma.book.findUnique({
      where: { id },
    });
  }

  async findByIsbn(isbn: string) {
    return this.prisma.book.findUnique({
      where: { isbn },
    });
  }

  async update(id: number, data: Prisma.BookUpdateInput) {
    return this.prisma.book.update({
      where: { id },
      data,
    });
  }

  async updateStock(id: number, stock: number) {
    return this.prisma.book.update({
      where: { id },
      data: { stock },
    });
  }

  async incrementSoldCount(id: number, quantity: number) {
    return this.prisma.book.update({
      where: { id },
      data: {
        soldCount: {
          increment: quantity,
        },
        stock: {
          decrement: quantity,
        },
      },
    });
  }

  async softDelete(id: number) {
    return this.prisma.book.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async hardDelete(id: number) {
    return this.prisma.book.delete({
      where: { id },
    });
  }
}
