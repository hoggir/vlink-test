const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
  }
}

// Auto logout function with modal
function handleUnauthorized() {
  if (typeof window !== 'undefined') {
    // Try to trigger modal if available
    if (typeof window.triggerSessionExpired === 'function') {
      window.triggerSessionExpired();
    } else {
      // Fallback: direct redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
}

async function handleResponse(response, skipAutoLogout = false) {
  const data = await response.json();

  // Check if token is invalid (401 Unauthorized)
  // Skip auto logout for login/register endpoints
  if (response.status === 401 && !skipAutoLogout) {
    handleUnauthorized();
    throw new ApiError(
      'Session expired. Please login again.',
      401,
      null
    );
  }

  if (!response.ok) {
    throw new ApiError(
      data.message || 'An error occurred',
      data.statusCode || response.status,
      data.errors || null
    );
  }

  return data;
}

export const authApi = {
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    return handleResponse(response, true); // Skip auto logout
  },

  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    return handleResponse(response, true); // Skip auto logout
  },

  async logout(token) {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getProfile(token) {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async refreshToken(refreshToken) {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    return handleResponse(response);
  },
};

export const publicBooksApi = {
  async getBooks(params = {}, token) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);

    const url = `${API_BASE_URL}/public/books${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    return handleResponse(response);
  },

  async getBook(id, token) {
    const response = await fetch(`${API_BASE_URL}/public/books/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    return handleResponse(response);
  },
};

export const booksApi = {
  async getBooks(params = {}, token) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);

    const url = `${API_BASE_URL}/books${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getBook(id, token) {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async createBook(bookData, token) {
    const response = await fetch(`${API_BASE_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookData),
    });

    return handleResponse(response);
  },

  async updateBook(id, bookData, token) {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookData),
    });

    return handleResponse(response);
  },

  async updateStock(id, stockData, token) {
    const response = await fetch(`${API_BASE_URL}/books/${id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(stockData),
    });

    return handleResponse(response);
  },

  async deleteBook(id, token) {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },
};

export const cartApi = {
  async getCart(token) {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async addToCart(bookId, quantity, token) {
    const response = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ bookId, quantity }),
    });

    return handleResponse(response);
  },

  async updateCartItem(bookId, quantity, token) {
    const response = await fetch(`${API_BASE_URL}/cart/items/${bookId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });

    return handleResponse(response);
  },

  async removeFromCart(bookId, token) {
    const response = await fetch(`${API_BASE_URL}/cart/items/${bookId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async clearCart(token) {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },
};

export const checkoutApi = {
  async createCheckout(paymentMethod, token) {
    const response = await fetch(`${API_BASE_URL}/customer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentMethod }),
    });

    return handleResponse(response);
  },

  async getUserCheckouts(page = 1, limit = 10, token) {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/customer/checkout?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getCheckoutDetail(id, token) {
    const response = await fetch(`${API_BASE_URL}/customer/checkout/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },
};

// Admin Checkouts API
export const adminCheckoutApi = {
  async getAllCheckouts(params = {}, token) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.userId) queryParams.append('userId', params.userId);

    const url = `${API_BASE_URL}/checkouts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getCheckoutDetail(id, token) {
    const response = await fetch(`${API_BASE_URL}/checkouts/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getCheckoutStats(token) {
    const response = await fetch(`${API_BASE_URL}/checkouts/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async updatePaymentStatus(id, status, token) {
    const response = await fetch(`${API_BASE_URL}/checkouts/${id}/payment-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentStatus: status }),
    });

    return handleResponse(response);
  },
};

// Admin Reports API
export const reportsApi = {
  async getSalesReport(params = {}, token) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `${API_BASE_URL}/reports/sales${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getTopSellingBooks(limit = 10, token) {
    const response = await fetch(`${API_BASE_URL}/reports/top-selling?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getLowStockBooks(threshold = 10, token) {
    const response = await fetch(`${API_BASE_URL}/reports/low-stock?threshold=${threshold}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async getOverallStats(token) {
    const response = await fetch(`${API_BASE_URL}/reports/overall-stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },
};

export { ApiError };