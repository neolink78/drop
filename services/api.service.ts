import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Public Product APIs (for customers)
export const publicProductApi = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/api/public/products', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/api/public/products/${id}`);
    return response.data;
  },
};

// Public order tracking (for customers)
export const publicOrderApi = {
  getStatus: async (order: string, email: string) => {
    const response = await api.get('/api/public/orders/status', { params: { order, email } });
    return response.data;
  },
};

// Admin Product APIs
export const productApi = {
  scrape: async (url: string) => {
    const response = await api.post('/api/scrape', { url });
    return response.data;
  },
  
  create: async (data: { aliexpressUrl: string; markupPercentage?: number }) => {
    const response = await api.post('/api/admin/products', data);
    return response.data;
  },
  
  getAll: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/api/admin/products', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/api/admin/products/${id}`);
    return response.data;
  },
  
  updateMarkup: async (id: string, data: { markupPrice?: number; markupPercentage?: number }) => {
    const response = await api.put(`/api/admin/products/${id}/markup`, data);
    return response.data;
  },
  
  refresh: async (id: string) => {
    const response = await api.post(`/api/admin/products/${id}/refresh`);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/api/admin/products/${id}`);
    return response.data;
  },
  
  getAnalytics: async (id: string) => {
    const response = await api.get(`/api/admin/products/${id}/analytics`);
    return response.data;
  },
};

// Checkout APIs
export const checkoutApi = {
  createSession: async (data: {
    productId: string;
    quantity?: number;
    customerEmail?: string;
    skuId?: string;
    skuAttr?: string;
  }) => {
    const response = await api.post('/api/checkout/session', data);
    return response.data;
  },
  
  createPaymentLink: async (productId: string) => {
    const response = await api.post('/api/checkout/payment-link', { productId });
    return response.data;
  },
};

// Auth APIs
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },
  
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/api/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
  },
  
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
  
  updateProfile: async (data: { name?: string; email?: string; password?: string }) => {
    const response = await api.put('/api/auth/profile', data);
    return response.data;
  },
};

// AliExpress connection APIs (Admin only)
export const aliexpressApi = {
  getStatus: async () => {
    const response = await api.get('/api/admin/aliexpress/status');
    return response.data;
  },
  
  getAuthorizeUrl: async () => {
    const response = await api.get('/api/admin/aliexpress/authorize');
    return response.data;
  },
};

// Order APIs (Admin only)
export const orderApi = {
  create: async (data: any) => {
    const response = await api.post('/api/admin/orders', data);
    return response.data;
  },
  
  getAll: async (params?: { page?: number; limit?: number; status?: string; customerEmail?: string }) => {
    const response = await api.get('/api/admin/orders', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/api/admin/orders/${id}`);
    return response.data;
  },
  
  updateStatus: async (id: string, data: { status: string; aliexpressOrderId?: string; trackingNumber?: string }) => {
    const response = await api.put(`/api/admin/orders/${id}/status`, data);
    return response.data;
  },
  
  fulfill: async (id: string) => {
    const response = await api.post(`/api/admin/orders/${id}/fulfill`);
    return response.data;
  },
  
  refreshTracking: async (id: string) => {
    const response = await api.post(`/api/admin/orders/${id}/tracking/refresh`);
    return response.data;
  },
  
  refund: async (id: string, amount?: number) => {
    const response = await api.post(`/api/admin/orders/${id}/refund`, { amount });
    return response.data;
  },
  
  getStatistics: async () => {
    const response = await api.get('/api/admin/orders/statistics');
    return response.data;
  },
};

export default api;