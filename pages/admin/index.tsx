import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useOrderStatistics } from '@/lib/hooks/useSWR';
import { aliexpressApi } from '@/services/api.service';
import Link from 'next/link';

function AliExpressConnectionCard() {
  const [status, setStatus] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    aliexpressApi
      .getStatus()
      .then((res) => setStatus(res.data))
      .catch(() => setStatus(null));
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await aliexpressApi.getAuthorizeUrl();
      if (res?.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start AliExpress authorization');
      setIsConnecting(false);
    }
  };

  if (!status) return null;

  return (
    <div
      className={`rounded-lg p-4 flex items-center justify-between ${
        status.connected
          ? 'bg-green-50 border border-green-200'
          : 'bg-amber-50 border border-amber-200'
      }`}
    >
      <div>
        <p className="text-sm font-medium text-gray-900">
          AliExpress API :{' '}
          {status.connected
            ? 'connecté'
            : status.configured
            ? 'clés configurées, compte non connecté'
            : 'non configuré (mode mock)'}
        </p>
        {!status.configured && (
          <p className="text-xs text-gray-600 mt-1">
            Renseignez ALIEXPRESS_APP_KEY et ALIEXPRESS_APP_SECRET dans functions/.env puis redémarrez le serveur.
          </p>
        )}
        {status.configured && !status.connected && (
          <p className="text-xs text-gray-600 mt-1">
            Connectez votre compte acheteur AliExpress pour activer la récupération produit et le fulfillment automatique.
          </p>
        )}
      </div>
      {status.configured && !status.connected && (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="ml-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isConnecting ? 'Redirection...' : 'Connecter AliExpress'}
        </button>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { statistics, isLoading, isError } = useOrderStatistics();
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    );
  }
  
  if (isError) {
    return (
      <AdminLayout>
        <div className="text-center text-red-600">
          Error loading statistics. Please try again.
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <ProtectedRoute>
      <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        
        <AliExpressConnectionCard />
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics?.totalOrders || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      €{statistics?.totalRevenue?.toFixed(2) || '0.00'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {(statistics?.ordersByStatus?.DELIVERED || 0) + (statistics?.ordersByStatus?.SHIPPED || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics?.ordersByStatus?.PAID || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Order Status Breakdown */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Order Status Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {statistics?.ordersByStatus && Object.entries(statistics.ordersByStatus).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className="text-2xl font-semibold text-gray-900">{Number(count)}</div>
                  <div className="text-sm text-gray-500">{status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Orders
              </h3>
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statistics?.recentOrders?.map((order: any) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {order.id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customerEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.product?.title?.slice(0, 30)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        €{order.totalPaid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                          ${order.orderStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' : ''}
                          ${order.orderStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : ''}
                          ${order.orderStatus === 'PAID' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${order.orderStatus === 'FAILED' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
    </ProtectedRoute>
  );
}