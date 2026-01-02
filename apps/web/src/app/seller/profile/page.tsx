import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { formatCurrency, decimalToNumber } from '@/lib/money'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import QuickActions from './QuickActions'

// Temporary fix for UserRole import issue
enum UserRole {
  STORE_OWNER = 'STORE_OWNER',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

export default async function SellerProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== UserRole.STORE_OWNER) {
    redirect('/unauthorized')
  }

  // Get user details first to ensure we have valid user ID
  const user = await db.user.findUnique({
    where: { id: parseInt(session.user.id) }
  })

  if (!user) {
    redirect('/auth/login')
  }

  // Get store details - use the store owned by this user (not user.store which is for customers/suppliers)
  // Order by most recent to ensure we get the primary store if multiple exist
  const store = await db.store.findFirst({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  // Get recent orders
  const orders = await db.order.findMany({
    where: { 
      storeId: store?.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })

  const totalOrders = await db.order.count({
    where: { storeId: store?.id }
  })

  const totalRevenue = await db.order.aggregate({
    where: { 
      storeId: store?.id,
      status: 'CONFIRMED'
    },
    _sum: { totalAmount: true }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserIcon className="h-8 w-8 mr-3 text-blue-600" />
              My Profile
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your account information and preferences
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Name</p>
                  <p className="text-sm text-gray-600">{session.user.name || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{session.user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Member Since</p>
                  <p className="text-sm text-gray-600">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Store Information */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Store Information</h3>
            {store ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <BuildingStorefrontIcon className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Store Name</p>
                    <p className="text-sm text-gray-600 font-semibold">{store.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Store ID: {store.slug}</p>
                    {store.address && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">Address</p>
                        <p className="text-xs text-gray-600 whitespace-pre-line">{store.address}</p>
                      </div>
                    )}
                    {store.gstin && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">GSTIN</p>
                        <p className="text-xs text-gray-600">{store.gstin}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <BuildingStorefrontIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No store found</p>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
            {orders && orders.length > 0 ? (
              <div className="space-y-3">
                {orders.slice(0, 3).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Order #{order.id.toString().slice(-8)}
                      </p>
                      <p className="text-xs text-gray-600">{order.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(decimalToNumber(order.totalAmount))}
                      </p>
                      <p className="text-xs text-gray-600">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No recent orders</p>
            )}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Account Stats */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Store Stats</h3>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(decimalToNumber(totalRevenue._sum.totalAmount || 0))}
                </p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>
    </div>
  )
}

