import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { 
  ShoppingBagIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  CurrencyRupeeIcon,
  BuildingStorefrontIcon,
  ArrowRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

// Temporary fix for UserRole import issue
enum UserRole {
  STORE_OWNER = 'STORE_OWNER',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

export default async function CustomerDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== UserRole.CUSTOMER) {
    redirect('/unauthorized')
  }

  // Get user with their assigned store
  const user = await db.user.findUnique({
    where: { id: parseInt(session.user.id) },
    include: { 
      store: true 
    }
  })

  // Get customer's orders
  const orders = await db.order.findMany({
    where: { 
      
      customerId: parseInt(session.user.id)
    },
    include: {
      store: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  })

  const totalOrders = orders.length
  const deliveredOrders = orders.filter((order: { status: string }) => order.status === 'DELIVERED').length
  const pendingOrders = orders.filter((order: { status: string }) => ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(order.status)).length
  const totalSpent = orders.reduce((sum: number, order: { totalAmount: number }) => sum + order.totalAmount, 0)

  return (
    <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ShoppingBagIcon className="h-8 w-8 mr-3 text-blue-600" />
                Welcome back, {session.user.name || 'Customer'}!
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your orders and explore our stores
              </p>
            </div>
            <div className="hidden sm:block">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
              >
                <BuildingStorefrontIcon className="h-4 w-4 mr-2" />
                Browse Stores
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <ShoppingBagIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{deliveredOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-sm">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                  <CurrencyRupeeIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{(totalSpent / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your latest order history
                </p>
              </div>
              <Link
                href="/customer/orders"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View All
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
          
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start shopping to see your orders here.</p>
              <div className="mt-6">
                <Link
                  href="/customer/shop"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Start Shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
                  {orders.slice(0, 5).map((order: { id: number; status: string; store: { name: string }; items: unknown[]; totalAmount: number; createdAt: Date }) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                          <ShoppingBagIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-semibold text-gray-900">
                            Order #{order.id.toString().slice(-8)}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <BuildingStorefrontIcon className="h-4 w-4 mr-1" />
                            {order.store.name}
                          </span>
                          <span>•</span>
                          <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span className="font-semibold text-gray-900">₹{(order.totalAmount / 100).toFixed(2)}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {order.createdAt instanceof Date ? order.createdAt.toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/customer/order-tracking?orderId=${order.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/customer/shop"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ShoppingBagIcon className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Shop Products</span>
                <ArrowRightIcon className="h-4 w-4 text-gray-400 ml-auto" />
              </Link>
              <Link
                href="/customer/orders"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ShoppingBagIcon className="h-5 w-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">View All Orders</span>
                <ArrowRightIcon className="h-4 w-4 text-gray-400 ml-auto" />
              </Link>
              <Link
                href="/customer/profile"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <CheckCircleIcon className="h-5 w-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Update Profile</span>
                <ArrowRightIcon className="h-4 w-4 text-gray-400 ml-auto" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Store Information</h3>
            {user?.store ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  You&apos;re assigned to <strong>{user.store.name}</strong>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  You don&apos;t have an assigned store yet. Contact your store owner to get access.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
