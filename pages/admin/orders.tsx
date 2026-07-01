import { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useOrders } from '@/lib/hooks/useSWR';
import { orderApi } from '@/services/api.service';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  PAID: 'bg-yellow-100 text-yellow-800',
  ORDERING: 'bg-blue-100 text-blue-800',
  ORDERED: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-orange-100 text-orange-800',
};

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  
  const { orders, pagination, isLoading, mutate } = useOrders({
    page,
    limit: 20,
    status: statusFilter || undefined,
    customerEmail: emailFilter || undefined,
  });
  
  const handleFulfill = async (orderId: string) => {
    if (!confirm('Are you sure you want to fulfill this order on AliExpress?')) {
      return;
    }
    
    try {
      await orderApi.fulfill(orderId);
      mutate();
      alert('Order fulfillment initiated');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to fulfill order');
    }
  };
  
  const handleRefreshTracking = async (orderId: string) => {
    try {
      const res = await orderApi.refreshTracking(orderId);
      mutate();
      const tracking = res?.data?.trackingNumber;
      alert(tracking ? `Tracking: ${tracking}` : 'No tracking number available yet');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to refresh tracking');
    }
  };
  
  const handleRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to refund this order?')) {
      return;
    }
    
    try {
      await orderApi.refund(orderId);
      mutate();
      alert('Order refunded successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to refund order');
    }
  };
  
  return (
    <ProtectedRoute>
      <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>
        
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status Filter
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="ORDERING">Ordering</option>
                <option value="ORDERED">Ordered</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Customer Email
              </label>
              <input
                type="email"
                id="email"
                value={emailFilter}
                onChange={(e) => {
                  setEmailFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by email..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Orders Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {order.id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{order.customerName}</div>
                          <div className="text-gray-500">{order.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.product?.title?.slice(0, 30)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{order.totalPaid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.orderStatus] || ''}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {['PAID', 'FAILED'].includes(order.orderStatus) && (
                          <button
                            onClick={() => handleFulfill(order.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {order.orderStatus === 'FAILED' ? 'Retry' : 'Fulfill'}
                          </button>
                        )}
                        {['ORDERED', 'SHIPPED'].includes(order.orderStatus) && (
                          <button
                            onClick={() => handleRefreshTracking(order.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Track
                          </button>
                        )}
                        {['PAID', 'ORDERED', 'SHIPPED', 'DELIVERED'].includes(order.orderStatus) && (
                          <button
                            onClick={() => handleRefund(order.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(page - 1) * 20 + 1}</span>{' '}
                    to{' '}
                    <span className="font-medium">{Math.min(page * 20, pagination.total)}</span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.total}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {page}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
    </ProtectedRoute>
  );
}