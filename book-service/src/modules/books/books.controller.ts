import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto, UpdateStockDto } from './dto/update-book.dto';
import { QueryBookDto } from './dto/query-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Books (Admin Only)')
@Controller('books')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new book (Admin only)',
    description:
      'Add a new book to the catalog. Only accessible by admin users.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Book created successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        message: { type: 'string', example: 'Book created successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: 'The Great Gatsby' },
            author: { type: 'string', example: 'F. Scott Fitzgerald' },
            isbn: { type: 'string', example: '978-3-16-148410-0' },
            description: { type: 'string', example: 'A classic novel' },
            price: { type: 'number', example: 19.99 },
            stock: { type: 'number', example: 100 },
            soldCount: { type: 'number', example: 0 },
            createdAt: { type: 'string', example: '2025-10-09T10:00:00.000Z' },
            updatedAt: { type: 'string', example: '2025-10-09T10:00:00.000Z' },
          },
        },
        timestamp: { type: 'string', example: '2025-10-09T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Book with this ISBN already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only admin users can access this endpoint',
    type: ErrorResponseDto,
  })
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all books (Admin only)',
    description:
      'Retrieve a list of all books without stock limitations. Supports pagination and search.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Books retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Books retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            books: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  title: { type: 'string', example: 'The Great Gatsby' },
                  author: { type: 'string', example: 'F. Scott Fitzgerald' },
                  price: { type: 'number', example: 19.99 },
                  stock: { type: 'number', example: 100 },
                  soldCount: { type: 'number', example: 50 },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 100 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 10 },
              },
            },
          },
        },
        timestamp: { type: 'string', example: '2025-10-09T10:00:00.000Z' },
      },
    },
  })
  findAll(@Query() query: QueryBookDto) {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get book by ID (Admin only)',
    description: 'Retrieve detailed information about a specific book.',
  })
  @ApiParam({
    name: 'id',
    description: 'Book ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Book retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Book not found',
    type: ErrorResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update book (Admin only)',
    description: 'Update book information including title, author, price, etc.',
  })
  @ApiParam({
    name: 'id',
    description: 'Book ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Book updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Book not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Book with this ISBN already exists',
    type: ErrorResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.update(id, updateBookDto);
  }

  @Patch(':id/stock')
  @ApiOperation({
    summary: 'Update book stock (Admin only)',
    description: 'Update or reduce book stock quantity.',
  })
  @ApiParam({
    name: 'id',
    description: 'Book ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Book stock updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Book not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Stock cannot be negative',
    type: ErrorResponseDto,
  })
  updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    return this.booksService.updateStock(id, updateStockDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete book (Admin only)',
    description: 'Soft delete a book from the catalog.',
  })
  @ApiParam({
    name: 'id',
    description: 'Book ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Book deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Book not found',
    type: ErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }
}
