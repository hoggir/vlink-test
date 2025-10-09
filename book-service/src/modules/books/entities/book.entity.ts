import { Book as PrismaBook } from '@prisma/client';

export class Book implements PrismaBook {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  price: any;
  stock: number;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  isDeleted: boolean;
}
