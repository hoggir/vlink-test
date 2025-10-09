import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BooksRepository } from './books.repository';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto, UpdateStockDto } from './dto/update-book.dto';
import { QueryBookDto } from './dto/query-book.dto';
import { encryptId } from 'src/common/utils/crypto.util';

@Injectable()
export class BooksService {
  constructor(private readonly booksRepository: BooksRepository) {}

  async create(createBookDto: CreateBookDto) {
    if (createBookDto.isbn) {
      const existingBook = await this.booksRepository.findByIsbn(
        createBookDto.isbn,
      );
      if (existingBook && !existingBook.isDeleted) {
        throw new ConflictException('Book with this ISBN already exists');
      }
    }

    const book = await this.booksRepository.create({
      title: createBookDto.title,
      author: createBookDto.author,
      isbn: createBookDto.isbn,
      description: createBookDto.description,
      price: createBookDto.price,
      stock: createBookDto.stock || 0,
    });

    return {
      message: 'Book created successfully',
      data: {
        ...book,
        id: encryptId(book.id),
      },
    };
  }

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
      ...book,
      id: encryptId(book.id),
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

    if (!book || book.isDeleted) {
      throw new NotFoundException('Book not found');
    }

    return {
      message: 'Book retrieved successfully',
      data: {
        ...book,
        id: encryptId(book.id),
      },
    };
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    const book = await this.booksRepository.findById(id);

    if (!book || book.isDeleted) {
      throw new NotFoundException('Book not found');
    }

    if (updateBookDto.isbn && updateBookDto.isbn !== book.isbn) {
      const existingBook = await this.booksRepository.findByIsbn(
        updateBookDto.isbn,
      );
      if (existingBook && !existingBook.isDeleted) {
        throw new ConflictException('Book with this ISBN already exists');
      }
    }

    const updatedBook = await this.booksRepository.update(id, updateBookDto);

    return {
      message: 'Book updated successfully',
      data: {
        ...updatedBook,
        id: encryptId(updatedBook.id),
      },
    };
  }

  async updateStock(id: number, updateStockDto: UpdateStockDto) {
    const book = await this.booksRepository.findById(id);

    if (!book || book.isDeleted) {
      throw new NotFoundException('Book not found');
    }

    if (updateStockDto.stock < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    const updatedBook = await this.booksRepository.updateStock(
      id,
      updateStockDto.stock,
    );

    return {
      message: 'Book stock updated successfully',
      data: {
        ...updatedBook,
        id: encryptId(updatedBook.id),
      },
    };
  }

  async remove(id: number) {
    const book = await this.booksRepository.findById(id);

    if (!book || book.isDeleted) {
      throw new NotFoundException('Book not found');
    }

    await this.booksRepository.softDelete(id);

    return {
      message: 'Book deleted successfully',
      data: null,
    };
  }

  async checkStock(bookId: number, quantity: number): Promise<boolean> {
    const book = await this.booksRepository.findById(bookId);

    if (!book || book.isDeleted) {
      throw new NotFoundException('Book not found');
    }

    return book.stock >= quantity;
  }

  async decrementStock(bookId: number, quantity: number) {
    const book = await this.booksRepository.findById(bookId);

    if (!book || book.isDeleted) {
      throw new NotFoundException('Book not found');
    }

    if (book.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    return this.booksRepository.incrementSoldCount(bookId, quantity);
  }
}
