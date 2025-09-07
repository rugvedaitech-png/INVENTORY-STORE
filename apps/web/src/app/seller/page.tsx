import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'

// Temporary fix for UserRole import issue
enum UserRole {
  STORE_OWNER = 'STORE_OWNER',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

export default async function SellerDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== UserRole.STORE_OWNER) {
    redirect('/unauthorized')
  }

  // Get store and basic stats
  const store = await db.store.findFirst({
    where: { ownerId: parseInt(session.user.id) },
    include: {
      _count: {
        select: {
          products: true,
          orders: true,
        }
      }
    }
  })

  const recentOrders = await db.order.findMany({
    where: { storeId: store?.id },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  const lowStockProducts = await db.product.findMany({
    where: {
      storeId: store?.id,
      stock: {
        lte: 10 // Products with stock <= 10
      }
    },
    orderBy: { stock: 'asc' },
    take: 5
  })

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user.name || session.user.email}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your {store?.name || 'store'} inventory and orders
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">📦</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Products
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {store?._count?.products || 0}
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
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">📋</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Orders
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {store?._count?.orders || 0}
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
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">⚠️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Low Stock Items
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {lowStockProducts.length}
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
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Store Status
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Active
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Orders
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Latest customer orders
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {recentOrders.map((order: any) => (
            <li key={order.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-600 font-bold">#{order.id.slice(-4)}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        Order #{order.id.slice(-8)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer?.name || 'Guest'} • {order.items.length} items
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                    <div className="ml-4 text-sm text-gray-900">
                      ₹{(order.total / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {recentOrders.length === 0 && (
            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
              No orders yet
            </li>
          )}
        </ul>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Low Stock Alert
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>The following products are running low on stock:</p>
                <ul className="mt-2 list-disc list-inside">
                  {lowStockProducts.map((product: any) => (
                    <li key={product.id}>
                      {product.title} - {product.stock} units left
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <Link
                  href="/seller/inventory"
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  Manage Inventory →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/seller/products"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  📦
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  Manage Products
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add, edit, or remove products from your store
                </p>
              </div>
            </Link>

            <Link
              href="/seller/orders"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  📋
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  View Orders
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Track and manage customer orders
                </p>
              </div>
            </Link>

            <Link
              href="/seller/inventory"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  📊
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  Inventory
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Monitor stock levels and reorder points
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
