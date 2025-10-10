'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { publicBooksApi, cartApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { refreshCart } = useCart();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && params.id) {
      fetchBookDetail();
    }
  }, [user, authLoading, params.id]);

  const fetchBookDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await publicBooksApi.getBook(params.id, token);
      setBook(response.data);
    } catch (error) {
      setError(error.message || 'Failed to fetch book details');
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!book || quantity < 1) return;

    if (quantity > book.stock) {
      setError(`Only ${book.stock} items available in stock`);
      return;
    }

    setAddingToCart(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      await cartApi.addToCart(book.id, quantity, token);
      setSuccessMessage(`Added ${quantity} item(s) to cart successfully!`);
      setQuantity(1);

      // Refresh cart count
      refreshCart();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      setError(error.message || 'Failed to add to cart');
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (value) => {
    const newQuantity = parseInt(value);
    if (isNaN(newQuantity) || newQuantity < 1) {
      setQuantity(1);
    } else if (newQuantity > book?.stock) {
      setQuantity(book.stock);
    } else {
      setQuantity(newQuantity);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error && !book) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <Link
              href="/shop"
              className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  const isOutOfStock = book.stock === 0;
  const isLowStock = book.stock > 0 && book.stock <= 5;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/shop" className="hover:text-indigo-600">
            Shop
          </Link>
          <span>/</span>
          <span className="text-gray-900">{book.title}</span>
        </nav>

        {/* Book Detail */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left Column - Book Image Placeholder */}
            <div className="flex items-center justify-center bg-gray-100 rounded-lg p-12">
              <div className="text-center">
                <svg
                  className="mx-auto h-48 w-48 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <p className="mt-4 text-gray-500 font-medium">{book.title}</p>
              </div>
            </div>

            {/* Right Column - Book Info */}
            <div className="flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
                  {isOutOfStock && (
                    <span className="px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full">
                      Out of Stock
                    </span>
                  )}
                  {isLowStock && (
                    <span className="px-3 py-1 text-sm font-semibold text-orange-800 bg-orange-100 rounded-full">
                      Low Stock
                    </span>
                  )}
                </div>

                <p className="text-xl text-gray-600 mb-6">by {book.author}</p>

                <div className="mb-6">
                  <p className="text-4xl font-bold text-indigo-600">${book.price}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {book.stock} {book.stock === 1 ? 'item' : 'items'} available
                  </p>
                </div>

                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium w-24">ISBN:</span>
                    <span className="text-gray-900">{book.isbn}</span>
                  </div>
                  {book.soldCount !== undefined && (
                    <div className="flex items-center">
                      <span className="text-gray-600 font-medium w-24">Sold:</span>
                      <span className="text-gray-900">{book.soldCount} copies</span>
                    </div>
                  )}
                </div>

                {book.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                    <p className="text-gray-600 leading-relaxed">{book.description}</p>
                  </div>
                )}
              </div>

              {/* Add to Cart Section */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                {successMessage && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm font-medium">{successMessage}</p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {!isOutOfStock && (
                  <div className="flex items-center gap-4 mb-4">
                    <label className="text-gray-700 font-medium">Quantity:</label>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        className="px-4 py-2 hover:bg-gray-100 transition-colors"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={book.stock}
                        value={quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        className="w-20 px-3 py-2 text-center border-x border-gray-300 focus:outline-none"
                      />
                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="px-4 py-2 hover:bg-gray-100 transition-colors"
                        disabled={quantity >= book.stock}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-gray-600 text-sm">
                      (Max: {book.stock})
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || addingToCart}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                      isOutOfStock
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : addingToCart
                        ? 'bg-indigo-400 text-white cursor-wait'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {addingToCart ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Adding to Cart...
                      </span>
                    ) : isOutOfStock ? (
                      'Out of Stock'
                    ) : (
                      'Add to Cart'
                    )}
                  </button>

                  <Link
                    href="/cart"
                    className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                  >
                    View Cart
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link
            href="/shop"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
