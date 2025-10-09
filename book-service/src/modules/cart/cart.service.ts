import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { BooksRepository } from '../books/books.repository';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { decryptId, encryptId } from '../../common/utils/crypto.util';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private readonly booksRepository: BooksRepository,
  ) {}

  async getCart(userId: number) {
    let cart = await this.cartModel.findOne({ userId }).lean();

    if (!cart) {
      const newCart = await this.cartModel.create({
        userId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
      });
      cart = newCart.toObject() as any;
    }

    const encryptedCart = {
      ...cart,
      items:
        cart?.items?.map((item) => ({
          ...item,
          bookId: encryptId(item.bookId),
        })) || [],
    };

    return {
      message: 'Cart retrieved successfully',
      data: encryptedCart,
    };
  }

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    const bookId = decryptId(addToCartDto.bookId);

    const book = await this.booksRepository.findById(bookId);
    if (!book || book.isDeleted) {
      throw new NotFoundException('Book not found');
    }

    if (book.stock < addToCartDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${book.stock}`,
      );
    }

    let cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      cart = new this.cartModel({
        userId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.bookId === bookId,
    );

    if (existingItemIndex >= 0) {
      const newQuantity =
        cart.items[existingItemIndex].quantity + addToCartDto.quantity;

      if (newQuantity > book.stock) {
        throw new BadRequestException(
          `Cannot add ${addToCartDto.quantity} items. Max available: ${book.stock - cart.items[existingItemIndex].quantity}`,
        );
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].subtotal = newQuantity * Number(book.price);
    } else {
      cart.items.push({
        bookId: book.id,
        title: book.title,
        author: book.author,
        price: Number(book.price),
        quantity: addToCartDto.quantity,
        subtotal: addToCartDto.quantity * Number(book.price),
      });
    }

    this.recalculateTotals(cart);

    await cart.save();

    const encryptedCart = {
      ...cart.toObject(),
      items: cart.items.map((item) => ({
        ...item,
        bookId: encryptId(item.bookId),
      })),
    };

    return {
      message: 'Item added to cart successfully',
      data: encryptedCart,
    };
  }

  async updateCartItem(
    userId: number,
    encryptedBookId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const bookId = decryptId(encryptedBookId);

    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex((item) => item.bookId === bookId);
    if (itemIndex < 0) {
      throw new NotFoundException('Item not found in cart');
    }

    const book = await this.booksRepository.findById(bookId);
    if (!book || book.isDeleted) {
      throw new NotFoundException('Book not found');
    }

    if (updateCartItemDto.quantity > book.stock) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${book.stock}`,
      );
    }

    cart.items[itemIndex].quantity = updateCartItemDto.quantity;
    cart.items[itemIndex].subtotal =
      updateCartItemDto.quantity * cart.items[itemIndex].price;

    this.recalculateTotals(cart);
    await cart.save();

    const encryptedCart = {
      ...cart.toObject(),
      items: cart.items.map((item) => ({
        ...item,
        bookId: encryptId(item.bookId),
      })),
    };

    return {
      message: 'Cart item updated successfully',
      data: encryptedCart,
    };
  }

  async removeFromCart(userId: number, encryptedBookId: string) {
    const bookId = decryptId(encryptedBookId);

    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex((item) => item.bookId === bookId);
    if (itemIndex < 0) {
      throw new NotFoundException('Item not found in cart');
    }

    cart.items.splice(itemIndex, 1);
    this.recalculateTotals(cart);
    await cart.save();

    const encryptedCart = {
      ...cart.toObject(),
      items: cart.items.map((item) => ({
        ...item,
        bookId: encryptId(item.bookId),
      })),
    };

    return {
      message: 'Item removed from cart successfully',
      data: encryptedCart,
    };
  }

  async clearCart(userId: number) {
    await this.cartModel.findOneAndUpdate(
      { userId },
      {
        items: [],
        totalAmount: 0,
        totalItems: 0,
      },
      { new: true, upsert: true },
    );

    return {
      message: 'Cart cleared successfully',
      data: null,
    };
  }

  private recalculateTotals(cart: CartDocument): void {
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  async getCartForCheckout(userId: number): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    return cart;
  }
}
