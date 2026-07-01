import { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useProducts } from '@/lib/hooks/useSWR';
import { productApi } from '@/services/api.service';
import Link from 'next/link';

export default function AdminProducts() {
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    aliexpressUrl: '',
    markupPercentage: 50,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { products, isLoading, mutate } = useProducts(1, 1);
  const currentProduct = products[0];
  
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    setSuccess('');
    
    try {
      await productApi.create(createForm);
      setSuccess('Product created successfully!');
      setCreateForm({ aliexpressUrl: '', markupPercentage: 50 });
      mutate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create product');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleRefresh = async (productId: string) => {
    try {
      await productApi.refresh(productId);
      mutate();
    } catch (err) {
      console.error('Failed to refresh product:', err);
    }
  };
  
  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      await productApi.delete(productId);
      mutate();
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };
  
  return (
    <ProtectedRoute>
      <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-sm text-gray-600">Manage your dropshipping product</p>
        </div>
        
        {/* Create Product Form */}
        {!currentProduct ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Set Up Your Product</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter an AliExpress product URL to start selling. You can only have one active product at a time.
            </p>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                AliExpress URL
              </label>
              <input
                type="url"
                id="url"
                required
                value={createForm.aliexpressUrl}
                onChange={(e) => setCreateForm({ ...createForm, aliexpressUrl: e.target.value })}
                placeholder="https://www.aliexpress.com/item/..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="markup" className="block text-sm font-medium text-gray-700">
                Markup Percentage (%)
              </label>
              <input
                type="number"
                id="markup"
                required
                min="0"
                max="500"
                value={createForm.markupPercentage}
                onChange={(e) => setCreateForm({ ...createForm, markupPercentage: parseInt(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Product'}
            </button>
          </form>
        </div>
        ) : null}
        
        {/* Current Product */}
        {currentProduct && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Current Product</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
                    {currentProduct.images?.[0] ? (
                      <img 
                        src={currentProduct.images[0]} 
                        alt={currentProduct.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{currentProduct.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">ID: {currentProduct.aliexpressId}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Original Price</p>
                      <p className="text-lg font-semibold text-gray-900">€{currentProduct.originalPrice}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Your Price</p>
                      <p className="text-lg font-semibold text-indigo-600">€{currentProduct.markupPrice}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                      <p className="text-lg font-semibold text-green-600">
                        €{(currentProduct.markupPrice - currentProduct.originalPrice).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Updated</p>
                      <p className="text-sm text-gray-900">
                        {new Date(currentProduct.lastScraped).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 space-y-2">
                    <div className="flex space-x-2">
                      <Link
                        href={`/`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View Live Product
                      </Link>
                      <button
                        onClick={() => handleRefresh(currentProduct.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Refresh Data
                      </button>
                    </div>
                    <div>
                      <button
                        onClick={() => handleDelete(currentProduct.id)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove Product
                      </button>
                      <p className="text-xs text-gray-500 mt-1">This will allow you to add a new product</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
    </ProtectedRoute>
  );
}