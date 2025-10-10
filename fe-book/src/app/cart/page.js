'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cartApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refreshCart } = useCart();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingItem, setUpdatingItem] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchCart();
    }
  }, [user, authLoading]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await cartApi.getCart(token);
      setCart(response.data);
    } catch (error) {
      setError(error.message || 'Failed to fetch cart');
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (bookId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdatingItem(bookId);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      await cartApi.updateCartItem(bookId, newQuantity, token);
      await fetchCart();
      refreshCart();
    } catch (error) {
      setError(error.message || 'Failed to update quantity');
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (bookId) => {
    if (!confirm('Are you sure you want to remove this item from cart?')) {
      return;
    }

    setUpdatingItem(bookId);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      await cartApi.removeFromCart(bookId, token);
      await fetchCart();
      refreshCart();
    } catch (error) {
      setError(error.message || 'Failed to remove item');
      console.error('Error removing item:', error);
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }

    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      await cartApi.clearCart(token);
      await fetchCart();
      refreshCart();
    } catch (error) {
      setError(error.message || 'Failed to clear cart');
      console.error('Error clearing cart:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const isEmpty = cartItems.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="mt-2 text-gray-600">
              {isEmpty ? 'Your cart is empty' : `${cartItems.length} item(s) in cart`}
            </p>
          </div>
          {!isEmpty && (
            <button
              onClick={handleClearCart}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isEmpty ? (
          /* Empty Cart */
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-2 text-gray-500">Start shopping to add items to your cart.</p>
            <Link
              href="/shop"
              className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Books
            </Link>
          </div>
        ) : (
          /* Cart Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.bookId}
                  className="bg-white rounded-lg shadow-md p-6 flex items-center gap-6"
                >
                  {/* Book Icon */}
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/shop/${item.bookId}`}
                      className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      {item.title}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">by {item.author}</p>
                    <p className="text-lg font-bold text-indigo-600 mt-2">
                      ${item.price}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(item.bookId, item.quantity - 1)}
                        disabled={updatingItem === item.bookId || item.quantity <= 1}
                        className="px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 border-x border-gray-300 min-w-[3rem] text-center">
                        {updatingItem === item.bookId ? '...' : item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.bookId, item.quantity + 1)}
                        disabled={updatingItem === item.bookId}
                        className="px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm text-gray-500">
                      Subtotal: ${item.subtotal?.toFixed(2) || (parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>

                    <button
                      onClick={() => handleRemoveItem(item.bookId)}
                      disabled={updatingItem === item.bookId}
                      className="text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({cart.totalItems || 0})</span>
                    <span>${cart.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-indigo-600">${cart.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all text-center"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/shop"
                  className="block text-center mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Continue Shopping
                </Link>

                {/* Cart Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Secure checkout • Free shipping on all orders
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
