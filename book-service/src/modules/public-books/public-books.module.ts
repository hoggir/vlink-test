import { Module } from '@nestjs/common';
import { PublicBooksController } from './public-books.controller';
import { PublicBooksService } from './public-books.service';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [BooksModule],
  controllers: [PublicBooksController],
  providers: [PublicBooksService],
})
export class PublicBooksModule {}
