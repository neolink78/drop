import useSWR from 'swr';
import { productApi, publicProductApi, orderApi } from '@/services/api.service';

// Public Product hooks (for customers)
export const usePublicProducts = (page: number = 1, limit: number = 20) => {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/public/products?page=${page}&limit=${limit}`,
    () => publicProductApi.getAll({ page, limit })
  );
  
  return {
    products: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
};

export const usePublicProduct = (id: string | undefined) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/public/products/${id}` : null,
    () => publicProductApi.getById(id!)
  );
  
  return {
    product: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
};

// Admin Product hooks
export const useProducts = (page: number = 1, limit: number = 20) => {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/products?page=${page}&limit=${limit}`,
    () => productApi.getAll({ page, limit })
  );
  
  return {
    products: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
};

export const useProduct = (id: string | undefined) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/admin/products/${id}` : null,
    () => productApi.getById(id!)
  );
  
  return {
    product: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
};

export const useProductAnalytics = (id: string | undefined) => {
  const { data, error, isLoading } = useSWR(
    id ? `/api/products/${id}/analytics` : null,
    () => productApi.getAnalytics(id!)
  );
  
  return {
    analytics: data?.data,
    isLoading,
    isError: error,
  };
};

// Order hooks (Admin)
export const useOrders = (params?: { page?: number; limit?: number; status?: string; customerEmail?: string }) => {
  const queryString = new URLSearchParams(params as any).toString();
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/orders?${queryString}`,
    () => orderApi.getAll(params)
  );
  
  return {
    orders: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
};

export const useOrder = (id: string | undefined) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/admin/orders/${id}` : null,
    () => orderApi.getById(id!)
  );
  
  return {
    order: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
};

export const useOrderStatistics = () => {
  const { data, error, isLoading } = useSWR(
    '/api/admin/orders/statistics',
    () => orderApi.getStatistics()
  );
  
  return {
    statistics: data?.data,
    isLoading,
    isError: error,
  };
};