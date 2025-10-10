'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { checkoutApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && params.id) {
      fetchOrderDetail();
    }
  }, [user, authLoading, params.id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await checkoutApi.getCheckoutDetail(params.id, token);
      setOrder(response.data);
    } catch (error) {
      setError(error.message || 'Failed to fetch order details');
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
      case 'EXPIRED': return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error || 'Order not found'}</p>
            <Link href="/orders" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/orders" className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 inline-flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Order Details</h1>
          <p className="mt-2 text-gray-600">Order #{order.referenceNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status */}
            <div className={`border-2 rounded-lg p-6 ${getStatusColor(order.paymentStatus)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Order Status</h2>
                  <p className="text-sm mt-1">
                    {order.paymentStatus === 'PENDING' && 'Waiting for payment'}
                    {order.paymentStatus === 'PAID' && 'Payment confirmed'}
                    {order.paymentStatus === 'EXPIRED' && 'Order has expired'}
                    {order.paymentStatus === 'CANCELLED' && 'Order has been cancelled'}
                  </p>
                </div>
                <span className="text-2xl font-bold">{order.paymentStatus}</span>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.book?.title || 'Unknown'}</h3>
                      <p className="text-sm text-gray-600">by {item.book?.author || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${parseFloat(item.subtotal || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8 space-y-6">
              {/* Summary */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items)</span>
                    <span>${parseFloat(order.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-indigo-600">${parseFloat(order.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
                <div className="space-y-2 text-sm">
                  {order.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium">{order.paymentMethod.replace('_', ' ')}</span>
                    </div>
                  )}
                  {order.paymentReferenceNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ref Number:</span>
                      <span className="font-medium">{order.paymentReferenceNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {order.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid At:</span>
                      <span className="font-medium">
                        {new Date(order.paidAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {order.paymentStatus === 'PAID' && (
                <div className="border-t border-gray-200 pt-6">
                  <Link href="/shop" className="block w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center">
                    Continue Shopping
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
