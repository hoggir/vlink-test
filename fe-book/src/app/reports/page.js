'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { reportsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Overview Stats
  const [overallStats, setOverallStats] = useState(null);

  // Sales Report
  const [salesReport, setSalesReport] = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [salesPagination, setSalesPagination] = useState({ page: 1, limit: 10 });
  const [searchQuery, setSearchQuery] = useState('');

  // Top Selling
  const [topSelling, setTopSelling] = useState([]);
  const [topSellingLimit, setTopSellingLimit] = useState(10);

  // Low Stock
  const [lowStock, setLowStock] = useState([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, activeTab, salesPagination.page, searchQuery, topSellingLimit, lowStockThreshold]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      if (activeTab === 'overview') {
        const statsResponse = await reportsApi.getOverallStats(token);
        setOverallStats(statsResponse.data);
      } else if (activeTab === 'sales') {
        const salesResponse = await reportsApi.getSalesReport({
          page: salesPagination.page,
          limit: salesPagination.limit,
          search: searchQuery || undefined,
        }, token);
        setSalesReport(salesResponse.data?.books || []);
        setSalesSummary(salesResponse.data?.summary);
        if (salesResponse.data?.pagination) {
          setSalesPagination(prev => ({
            ...prev,
            total: salesResponse.data.pagination.total,
            totalPages: salesResponse.data.pagination.totalPages,
          }));
        }
      } else if (activeTab === 'top-selling') {
        const topResponse = await reportsApi.getTopSellingBooks(topSellingLimit, token);
        setTopSelling(topResponse.data || []);
      } else if (activeTab === 'low-stock') {
        const lowResponse = await reportsApi.getLowStockBooks(lowStockThreshold, token);
        setLowStock(lowResponse.data || []);
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">View sales reports and statistics</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sales'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sales Report
            </button>
            <button
              onClick={() => setActiveTab('top-selling')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'top-selling'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Top Selling
            </button>
            <button
              onClick={() => setActiveTab('low-stock')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'low-stock'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Low Stock
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Books</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{overallStats.totalBooks}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-3xl font-semibold text-gray-900">${parseFloat(overallStats.totalRevenue || 0).toFixed(2)}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sold</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{overallStats.totalSold}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Stock</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{overallStats.totalStock}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Price</dt>
                    <dd className="text-3xl font-semibold text-gray-900">${parseFloat(overallStats.averagePrice || 0).toFixed(2)}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{overallStats.booksOutOfStock}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{overallStats.booksLowStock}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSalesPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Summary Cards */}
            {salesSummary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Total Books</p>
                  <p className="text-2xl font-bold text-gray-900">{salesSummary.totalBooks}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Total Sold</p>
                  <p className="text-2xl font-bold text-gray-900">{salesSummary.totalSold}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Total Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{salesSummary.totalStock}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-indigo-600">${parseFloat(salesSummary.totalRevenue || 0).toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Sales Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesReport.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{book.title}</div>
                        <div className="text-sm text-gray-500">{book.author}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">${parseFloat(book.pricePerUnit).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{book.stock}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{book.soldCount}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600">${parseFloat(book.revenue).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {salesPagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {salesPagination.page} of {salesPagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSalesPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={salesPagination.page === 1}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setSalesPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={salesPagination.page === salesPagination.totalPages}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'top-selling' && (
          <div>
            {/* Limit Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Show top
              </label>
              <select
                value={topSellingLimit}
                onChange={(e) => setTopSellingLimit(parseInt(e.target.value))}
                className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="5">5 books</option>
                <option value="10">10 books</option>
                <option value="20">20 books</option>
                <option value="50">50 books</option>
              </select>
            </div>

            {/* Top Selling Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topSelling.map((book, index) => (
                <div key={book.id} className="bg-white rounded-lg shadow-md p-6 relative">
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full font-bold">
                      #{index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-12">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{book.author}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">${parseFloat(book.pricePerUnit).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sold:</span>
                      <span className="font-medium text-green-600">{book.soldCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-medium">{book.stock}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-bold text-indigo-600">${parseFloat(book.revenue).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'low-stock' && (
          <div>
            {/* Threshold Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock threshold
              </label>
              <select
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value))}
                className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="5">Below 5</option>
                <option value="10">Below 10</option>
                <option value="20">Below 20</option>
                <option value="50">Below 50</option>
              </select>
            </div>

            {/* Low Stock Table */}
            {lowStock.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">All good!</h3>
                <p className="mt-1 text-sm text-gray-500">No books with low stock at this threshold.</p>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStock.map((book) => (
                      <tr key={book.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          <div className="text-sm text-gray-500">{book.author}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">${parseFloat(book.price).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            book.stock === 0
                              ? 'bg-red-100 text-red-800'
                              : book.stock <= 5
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {book.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{book.soldCount}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            book.stock === 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {book.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
