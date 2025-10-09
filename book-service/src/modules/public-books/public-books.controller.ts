import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PublicBooksService } from './public-books.service';
import { QueryBookDto } from '../books/dto/query-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { DecryptIdPipe } from '../../common/pipes/decrypt-id.pipe';

@ApiTags('Books (Customer)')
@Controller('public/books')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER')
export class PublicBooksController {
  constructor(private readonly publicBooksService: PublicBooksService) {}

  @Get()
  @ApiOperation({
    summary: 'Get available books (Customer only)',
    description:
      'Retrieve books that are in stock. Only shows books with stock > 0.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Books retrieved successfully',
  })
  findAll(@Query() query: QueryBookDto) {
    return this.publicBooksService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get book details (Customer only)',
    description: 'Retrieve detailed information about a specific book',
  })
  @ApiParam({
    name: 'id',
    description: 'Encrypted Book ID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Book retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Book not found or out of stock',
    type: ErrorResponseDto,
  })
  findOne(@Param('id', DecryptIdPipe) id: number) {
    return this.publicBooksService.findOne(id);
  }
}
