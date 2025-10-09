import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryReportDto } from './dto/query-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Reports (Admin Only)')
@Controller('reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({
    summary: 'Get sales report (Admin only)',
    description:
      'Generate a sales report for each book showing quantity sold, remaining stock, ' +
      'and total revenue. Supports pagination, search, and sorting.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales report retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Sales report retrieved successfully',
        },
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
                  pricePerUnit: { type: 'number', example: 19.99 },
                  stock: { type: 'number', example: 50 },
                  soldCount: { type: 'number', example: 100 },
                  revenue: { type: 'number', example: 1999.0 },
                },
              },
            },
            summary: {
              type: 'object',
              properties: {
                totalBooks: { type: 'number', example: 50 },
                totalSold: { type: 'number', example: 500 },
                totalStock: { type: 'number', example: 1000 },
                totalRevenue: { type: 'number', example: 9999.5 },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 50 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 5 },
              },
            },
          },
        },
        timestamp: { type: 'string', example: '2025-10-09T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only admin users can access this endpoint',
    type: ErrorResponseDto,
  })
  getSalesReport(@Query() query: QueryReportDto) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('top-selling')
  @ApiOperation({
    summary: 'Get top selling books (Admin only)',
    description: 'Retrieve the top selling books based on sold count.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of top books to retrieve',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top selling books retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Top selling books retrieved successfully',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: 'The Great Gatsby' },
              author: { type: 'string', example: 'F. Scott Fitzgerald' },
              pricePerUnit: { type: 'number', example: 19.99 },
              stock: { type: 'number', example: 50 },
              soldCount: { type: 'number', example: 100 },
              revenue: { type: 'number', example: 1999.0 },
            },
          },
        },
        timestamp: { type: 'string', example: '2025-10-09T10:00:00.000Z' },
      },
    },
  })
  getTopSellingBooks(@Query('limit', ParseIntPipe) limit: number = 10) {
    return this.reportsService.getTopSellingBooks(limit);
  }

  @Get('low-stock')
  @ApiOperation({
    summary: 'Get low stock books (Admin only)',
    description: 'Retrieve books with stock below a specified threshold.',
  })
  @ApiQuery({
    name: 'threshold',
    required: false,
    description: 'Stock threshold',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Low stock books retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Low stock books retrieved successfully',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: 'The Great Gatsby' },
              author: { type: 'string', example: 'F. Scott Fitzgerald' },
              price: { type: 'number', example: 19.99 },
              stock: { type: 'number', example: 5 },
              soldCount: { type: 'number', example: 95 },
            },
          },
        },
        timestamp: { type: 'string', example: '2025-10-09T10:00:00.000Z' },
      },
    },
  })
  getLowStockBooks(@Query('threshold', ParseIntPipe) threshold: number = 10) {
    return this.reportsService.getLowStockBooks(threshold);
  }

  @Get('overall-stats')
  @ApiOperation({
    summary: 'Get overall statistics (Admin only)',
    description:
      'Retrieve overall statistics including total books, sold count, stock, revenue, and alerts.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overall statistics retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Overall statistics retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            totalBooks: { type: 'number', example: 50 },
            totalSold: { type: 'number', example: 500 },
            totalStock: { type: 'number', example: 1000 },
            totalRevenue: { type: 'number', example: 9999.5 },
            averagePrice: { type: 'number', example: 24.99 },
            booksOutOfStock: { type: 'number', example: 5 },
            booksLowStock: { type: 'number', example: 10 },
          },
        },
        timestamp: { type: 'string', example: '2025-10-09T10:00:00.000Z' },
      },
    },
  })
  getOverallStats() {
    return this.reportsService.getOverallStats();
  }
}
