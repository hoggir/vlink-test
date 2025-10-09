import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { CustomerCheckoutService } from './customer-checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { DecryptIdPipe } from '../../common/pipes/decrypt-id.pipe';

@ApiTags('Checkout (Customer)')
@Controller('customer/checkout')
export class CustomerCheckoutController {
  constructor(
    private readonly customerCheckoutService: CustomerCheckoutService,
    @InjectQueue('payment') private readonly paymentQueue: Queue,
  ) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiOperation({
    summary: 'Create checkout from cart (Customer only)',
    description:
      'Convert cart items to checkout. Validates stock and creates transaction with race condition protection.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Checkout created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cart is empty or insufficient stock',
    type: ErrorResponseDto,
  })
  createCheckout(
    @CurrentUser() user: any,
    @Body() createCheckoutDto: CreateCheckoutDto,
  ) {
    return this.customerCheckoutService.createCheckout(
      user.userId,
      createCheckoutDto,
    );
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiOperation({
    summary: 'Get user checkout history (Customer only)',
    description: 'Retrieve all checkouts for the authenticated user',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checkouts retrieved successfully',
  })
  getUserCheckouts(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.customerCheckoutService.getUserCheckouts(
      user.userId,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiOperation({
    summary: 'Get checkout detail (Customer only)',
    description: 'Retrieve detailed information about a specific checkout',
  })
  @ApiParam({
    name: 'id',
    description: 'Encrypted Checkout ID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checkout detail retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Checkout not found',
    type: ErrorResponseDto,
  })
  getCheckoutDetail(
    @CurrentUser() user: any,
    @Param('id', DecryptIdPipe) id: string,
  ) {
    const decryptId = +id;
    return this.customerCheckoutService.getCheckoutDetail(
      user.userId,
      decryptId,
    );
  }

  @Post('payment-callback')
  @Public()
  @ApiOperation({
    summary: 'Payment callback endpoint (Public)',
    description:
      'Webhook endpoint for payment gateway to send payment status updates. Uses Redis queue for processing.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment callback queued successfully',
  })
  async paymentCallback(@Body() paymentCallbackDto: PaymentCallbackDto) {
    await this.paymentQueue.add('process-callback', {
      checkoutReferenceNumber: paymentCallbackDto.checkoutReferenceNumber,
      status: paymentCallbackDto.status,
      paymentReferenceNumber: paymentCallbackDto.paymentReferenceNumber,
    });

    return {
      message: 'Payment callback received and queued for processing',
      data: {
        checkoutReferenceNumber: paymentCallbackDto.checkoutReferenceNumber,
        status: 'queued',
      },
    };
  }
}
