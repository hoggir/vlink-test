import { Injectable, NotFoundException } from '@nestjs/common';
import { BooksRepository } from '../books/books.repository';
import { QueryBookDto } from '../books/dto/query-book.dto';
import { encryptId } from '../../common/utils/crypto.util';

@Injectable()
export class PublicBooksService {
  constructor(private readonly booksRepository: BooksRepository) {}

  async findAll(query: QueryBookDto) {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
      stock: { gt: 0 },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await this.booksRepository.count(where);

    const books = await this.booksRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const encryptedBooks = books.map((book) => ({
      id: encryptId(book.id),
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
      price: book.price,
      stock: book.stock,
      soldCount: book.soldCount,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    }));

    return {
      message: 'Books retrieved successfully',
      data: {
        books: encryptedBooks,
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
    const book = await this.booksRepository.findById(id);

    if (!book || book.isDeleted || book.stock <= 0) {
      throw new NotFoundException('Book not found or out of stock');
    }

    return {
      message: 'Book retrieved successfully',
      data: {
        id: encryptId(book.id),
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        description: book.description,
        price: book.price,
        stock: book.stock,
        soldCount: book.soldCount,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      },
    };
  }
}
