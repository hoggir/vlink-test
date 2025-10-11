'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { cartApi } from '@/lib/api';

const CartContext = createContext({});

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setCartCount(0);
        return;
      }

      // Check if user is admin - don't fetch cart for admin
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN') {
          setCartCount(0);
          return;
        }
      }

      const response = await cartApi.getCart(token);
      const totalItems = response.data?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(totalItems);
    } catch (error) {
      // Silently fail - cart count is not critical
      console.error('Failed to fetch cart count:', error);
      setCartCount(0);
    }
  };

  const refreshCart = () => {
    fetchCartCount();
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchCartCount();
    }
  }, []);

  const value = {
    cartCount,
    loading,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
