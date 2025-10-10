'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { publicBooksApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ShopPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 12 });

  useEffect(() => {
    // Check if user is logged in
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchBooks();
    }
  }, [user, authLoading, pagination.page]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await publicBooksApi.getBooks({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      }, token);

      // Filter books with stock > 0 (ready stock)
      const readyStockBooks = (response.data?.books || []).filter(book => book.stock > 0);
      setBooks(readyStockBooks);

      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch books');
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBooks();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book Store</h1>
          <p className="mt-2 text-gray-600">Browse available books in stock</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search books by title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading books...</p>
            </div>
          </div>
        ) : books.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No books available</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try a different search term.' : 'Check back later for new arrivals.'}
            </p>
          </div>
        ) : (
          /* Books Grid */
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <Link
                  href={`/shop/${book.id}`}
                  key={book.id}
                  className="bg-white overflow-hidden shadow-md rounded-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                        {book.title}
                      </h3>
                      {book.stock <= 5 && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">
                          Low Stock
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Author:</span> {book.author}
                    </p>

                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">ISBN:</span> {book.isbn}
                    </p>

                    {book.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {book.description}
                      </p>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-2xl font-bold text-indigo-600">
                          ${book.price}
                        </p>
                        <p className="text-xs text-gray-500">
                          {book.stock} in stock
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className={`px-4 py-2 rounded-lg ${
                    pagination.page === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-4 py-2 rounded-lg ${
                    pagination.page === pagination.totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
