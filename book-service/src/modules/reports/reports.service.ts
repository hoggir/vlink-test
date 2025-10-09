import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QueryReportDto } from './dto/query-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReport(query: QueryReportDto) {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'soldCount',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.book.count({ where });

    const books = await this.prisma.book.findMany({
      skip,
      take: limit,
      where,
      orderBy:
        sortBy === 'revenue'
          ? { soldCount: sortOrder }
          : { [sortBy]: sortOrder },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        price: true,
        stock: true,
        soldCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const booksWithRevenue = books.map((book) => ({
      ...book,
      revenue: Number(book.price) * book.soldCount,
      pricePerUnit: Number(book.price),
    }));

    if (sortBy === 'revenue') {
      booksWithRevenue.sort((a, b) => {
        return sortOrder === 'desc'
          ? b.revenue - a.revenue
          : a.revenue - b.revenue;
      });
    }

    const totals = booksWithRevenue.reduce(
      (acc, book) => {
        acc.totalSold += book.soldCount;
        acc.totalStock += book.stock;
        acc.totalRevenue += book.revenue;
        return acc;
      },
      { totalSold: 0, totalStock: 0, totalRevenue: 0 },
    );

    return {
      message: 'Sales report retrieved successfully',
      data: {
        books: booksWithRevenue,
        summary: {
          totalBooks: total,
          totalSold: totals.totalSold,
          totalStock: totals.totalStock,
          totalRevenue: totals.totalRevenue,
        },
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getTopSellingBooks(limit: number = 10) {
    const books = await this.prisma.book.findMany({
      where: {
        isDeleted: false,
        soldCount: {
          gt: 0,
        },
      },
      orderBy: {
        soldCount: 'desc',
      },
      take: limit,
      select: {
        id: true,
        title: true,
        author: true,
        price: true,
        stock: true,
        soldCount: true,
      },
    });

    const booksWithRevenue = books.map((book) => ({
      ...book,
      revenue: Number(book.price) * book.soldCount,
      pricePerUnit: Number(book.price),
    }));

    return {
      message: 'Top selling books retrieved successfully',
      data: booksWithRevenue,
    };
  }

  async getLowStockBooks(threshold: number = 10) {
    const books = await this.prisma.book.findMany({
      where: {
        isDeleted: false,
        stock: {
          lte: threshold,
        },
      },
      orderBy: {
        stock: 'asc',
      },
      select: {
        id: true,
        title: true,
        author: true,
        price: true,
        stock: true,
        soldCount: true,
      },
    });

    return {
      message: 'Low stock books retrieved successfully',
      data: books,
    };
  }

  async getOverallStats() {
    const [
      totalBooks,
      totalRevenue,
      totalSold,
      totalStock,
      booksOutOfStock,
      booksLowStock,
    ] = await Promise.all([
      this.prisma.book.count({
        where: { isDeleted: false },
      }),
      this.prisma.book.aggregate({
        where: { isDeleted: false },
        _sum: {
          soldCount: true,
        },
      }),
      this.prisma.book.aggregate({
        where: { isDeleted: false },
        _sum: {
          soldCount: true,
        },
      }),
      this.prisma.book.aggregate({
        where: { isDeleted: false },
        _sum: {
          stock: true,
        },
      }),
      this.prisma.book.count({
        where: {
          isDeleted: false,
          stock: 0,
        },
      }),
      this.prisma.book.count({
        where: {
          isDeleted: false,
          stock: {
            gt: 0,
            lte: 10,
          },
        },
      }),
    ]);

    const books = await this.prisma.book.findMany({
      where: { isDeleted: false },
      select: {
        price: true,
        soldCount: true,
      },
    });

    const totalRevenueAmount = books.reduce(
      (acc, book) => acc + Number(book.price) * book.soldCount,
      0,
    );

    const averagePrice =
      books.length > 0
        ? books.reduce((acc, book) => acc + Number(book.price), 0) /
          books.length
        : 0;

    return {
      message: 'Overall statistics retrieved successfully',
      data: {
        totalBooks,
        totalSold: totalSold._sum.soldCount || 0,
        totalStock: totalStock._sum.stock || 0,
        totalRevenue: totalRevenueAmount,
        averagePrice: Math.round(averagePrice * 100) / 100,
        booksOutOfStock,
        booksLowStock,
      },
    };
  }
}
