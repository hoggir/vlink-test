import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Cart (Customer)')
@Controller('cart')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user cart (Customer only)',
    description: 'Retrieve current user shopping cart with all items',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart retrieved successfully',
  })
  getCart(@CurrentUser() user: any) {
    return this.cartService.getCart(user.userId);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Add item to cart (Customer only)',
    description: 'Add a book to shopping cart. Stock will be validated.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item added to cart successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Insufficient stock',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Book not found',
    type: ErrorResponseDto,
  })
  addToCart(@CurrentUser() user: any, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(user.userId, addToCartDto);
  }

  @Patch('items/:bookId')
  @ApiOperation({
    summary: 'Update cart item quantity (Customer only)',
    description: 'Update the quantity of an item in cart',
  })
  @ApiParam({
    name: 'bookId',
    description: 'Encrypted Book ID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart item updated successfully',
  })
  updateCartItem(
    @CurrentUser() user: any,
    @Param('bookId') bookId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(
      user.userId,
      bookId,
      updateCartItemDto,
    );
  }

  @Delete('items/:bookId')
  @ApiOperation({
    summary: 'Remove item from cart (Customer only)',
    description: 'Remove a specific item from the cart',
  })
  @ApiParam({
    name: 'bookId',
    description: 'Encrypted Book ID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item removed from cart successfully',
  })
  removeFromCart(@CurrentUser() user: any, @Param('bookId') bookId: string) {
    return this.cartService.removeFromCart(user.userId, bookId);
  }

  @Delete()
  @ApiOperation({
    summary: 'Clear cart (Customer only)',
    description: 'Remove all items from cart',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart cleared successfully',
  })
  clearCart(@CurrentUser() user: any) {
    return this.cartService.clearCart(user.userId);
  }
}
