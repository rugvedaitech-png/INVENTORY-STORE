import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import SupplierLayoutClient from './SupplierLayoutClient'

// Temporary fix for UserRole import issue
enum UserRole {
  STORE_OWNER = 'STORE_OWNER',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

export default async function SupplierDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== UserRole.SUPPLIER) {
    redirect('/unauthorized')
  }

  // Get supplier information for this user
  const supplier = await db.supplier.findFirst({
    where: { 
      userId: parseInt(session.user.id)
    },
    include: {
      store: true
    }
  })

  // If no supplier record is linked, we'll show a message to contact store owner
  // instead of redirecting to a non-existent page

  // Get supplier-specific data only (if supplier is linked)
  const [
    purchaseOrders,
    lowStockProducts
  ] = await Promise.all([
    // Only purchase orders for this specific supplier
    supplier ? db.purchaseOrder.findMany({
      where: { 
        storeId: supplier.storeId,
        supplierId: supplier.id // Key privacy filter
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }) : [],
    
    // Low stock products for this supplier only
    supplier ? db.product.findMany({
      where: {
        storeId: supplier.storeId,
        supplierId: supplier.id, // Key privacy filter
        stock: { lte: 10 },
        active: true
      },
      select: {
        id: true,
        title: true,
        stock: true,
        reorderPoint: true
      },
      orderBy: { stock: 'asc' },
      take: 5
    }) : []
  ])

  return (
    <SupplierLayoutClient
      userEmail={session.user?.email || 'supplier@example.com'}
      userName={session.user?.name || 'Supplier User'}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Supplier Dashboard
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    {supplier 
                      ? `Managing inventory for ${supplier.store.name} as ${supplier.name}`
                      : 'Supplier account not linked. Please contact your store owner to link your account.'
                    }
                  </p>
                </div>
              </div>

              {/* Show message if supplier is not linked */}
              {!supplier && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Account Not Linked
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Your user account has supplier privileges, but it's not linked to a supplier record. 
                          Please contact your store owner to link your account to a supplier profile.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Supplier Stats Grid - Only show if supplier is linked */}
              {supplier && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Total Purchase Orders */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-bold">PO</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            My Purchase Orders
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {purchaseOrders.length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed POs */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-bold">✓</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Completed POs
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {purchaseOrders.filter(po => po.status === 'RECEIVED').length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Low Stock Items */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-bold">!</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            My Low Stock Items
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {lowStockProducts.length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* My Purchase Orders */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        My Purchase Orders
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Purchase orders assigned to you for fulfillment
                      </p>
                    </div>
                    <a
                      href="/supplier/purchase-orders"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      View All Orders
                    </a>
                  </div>
                </div>
                <ul className="divide-y divide-gray-200">
                  {purchaseOrders.length === 0 ? (
                    <li>
                      <div className="px-4 py-8 sm:px-6 text-center">
                        <div className="text-gray-500">
                          No purchase orders assigned to you yet.
                        </div>
                      </div>
                    </li>
                  ) : (
                    purchaseOrders.map((order) => (
                      <li key={order.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    PO
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.code}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {order.items.length} items • ₹{(order.total / 100).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Created: {new Date(order.createdAt).toLocaleDateString()}
                                  {order.placedAt && ` • Placed: ${new Date(order.placedAt).toLocaleDateString()}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                order.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                                order.status === 'SENT' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                                order.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {order.status === 'RECEIVED' ? 'DELIVERED' : order.status}
                              </span>
                              
                              {order.status === 'SENT' && (
                                <a
                                  href="/supplier/purchase-orders"
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                  Mark as Shipped
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Low Stock Alert */}
              {lowStockProducts.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 text-yellow-400">⚠️</div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Low Stock Alert - Your Products
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>The following products you supply are running low on stock:</p>
                        <ul className="mt-2 list-disc list-inside">
                          {lowStockProducts.map((product) => (
                            <li key={product.id}>
                              {product.title} - {product.stock} units left
                              {product.reorderPoint > 0 && (
                                <span className="text-yellow-600">
                                  {' '}(Reorder at {product.reorderPoint})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SupplierLayoutClient>
  )
}