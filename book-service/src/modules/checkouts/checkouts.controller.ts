import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
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
import { CheckoutsService } from './checkouts.service';
import { QueryCheckoutDto } from './dto/query-checkout.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { DecryptIdPipe } from '../../common/pipes/decrypt-id.pipe';
import { DecryptQueryIdPipe } from '../../common/pipes/decrypt-query-id.pipe';

@ApiTags('Checkouts (Admin Only)')
@Controller('checkouts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CheckoutsController {
  constructor(private readonly checkoutsService: CheckoutsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all checkouts (Admin only)',
    description:
      'Retrieve a list of all checkout transactions with payment status. ' +
      'Supports filtering by status and pagination.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checkouts retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Checkouts retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            checkouts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  userId: { type: 'number', example: 1 },
                  totalAmount: { type: 'number', example: 59.97 },
                  paymentStatus: { type: 'string', example: 'PAID' },
                  paymentMethod: { type: 'string', example: 'CREDIT_CARD', nullable: true },
                  createdAt: {
                    type: 'string',
                    example: '2025-10-09T10:00:00.000Z',
                  },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'number', example: 1 },
                      name: { type: 'string', example: 'John Doe' },
                      email: { type: 'string', example: 'john@example.com' },
                    },
                  },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', example: 1 },
                        bookId: { type: 'number', example: 1 },
                        quantity: { type: 'number', example: 2 },
                        price: { type: 'number', example: 19.99 },
                        subtotal: { type: 'number', example: 39.98 },
                      },
                    },
                  },
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
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only admin users can access this endpoint',
    type: ErrorResponseDto,
  })
  findAll(@Query(new DecryptQueryIdPipe('userId')) query: QueryCheckoutDto) {
    return this.checkoutsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get checkout statistics (Admin only)',
    description:
      'Retrieve statistics about checkouts including total count, revenue, and status breakdown.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Checkout statistics retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            totalCheckouts: { type: 'number', example: 150 },
            totalRevenue: { type: 'number', example: 2999.85 },
            statusBreakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  paymentStatus: { type: 'string', example: 'PAID' },
                  _count: {
                    type: 'object',
                    properties: {
                      paymentStatus: { type: 'number', example: 100 },
                    },
                  },
                },
              },
            },
          },
        },
        timestamp: { type: 'string', example: '2025-10-09T10:00:00.000Z' },
      },
    },
  })
  getStats() {
    return this.checkoutsService.getStats();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get checkout by ID (Admin only)',
    description:
      'Retrieve detailed information about a specific checkout transaction.',
  })
  @ApiParam({
    name: 'id',
    description: 'Checkout ID (encrypted)',
    example: 'dGVzdGVuY3J5cHRlZGlk...',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checkout retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Checkout not found',
    type: ErrorResponseDto,
  })
  findOne(@Param('id', DecryptIdPipe) id: string) {
    return this.checkoutsService.findOne(+id);
  }

  @Patch(':id/payment-status')
  @ApiOperation({
    summary: 'Update payment status (Admin only)',
    description: 'Update the payment status of a checkout transaction.',
  })
  @ApiParam({
    name: 'id',
    description: 'Checkout ID (encrypted)',
    example: 'dGVzdGVuY3J5cHRlZGlk...',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Checkout not found',
    type: ErrorResponseDto,
  })
  updatePaymentStatus(
    @Param('id', DecryptIdPipe) id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ) {
    return this.checkoutsService.updatePaymentStatus(
      +id,
      updatePaymentStatusDto,
    );
  }
}
