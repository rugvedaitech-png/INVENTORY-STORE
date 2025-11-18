import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import QuickActions from './QuickActions'
import SupplierLayoutClient from '../SupplierLayoutClient'

// Temporary fix for UserRole import issue
enum UserRole {
  STORE_OWNER = 'STORE_OWNER',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

export default async function SupplierProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== UserRole.SUPPLIER) {
    redirect('/unauthorized')
  }

  // Get supplier details
  const supplier = await db.supplier.findFirst({
    where: { userId: parseInt(session.user.id) },
    include: { store: true }
  })

  // Get user details
  const user = await db.user.findUnique({
    where: { id: parseInt(session.user.id) }
  })

  // Get recent purchase orders
  const purchaseOrders = supplier ? await db.purchaseOrder.findMany({
    where: { 
      supplierId: supplier.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  }) : []

  const totalPurchaseOrders = supplier ? await db.purchaseOrder.count({
    where: { supplierId: supplier.id }
  }) : 0

  return (
    <SupplierLayoutClient
      userEmail={session.user?.email || 'supplier@example.com'}
      userName={session.user?.name || 'Supplier User'}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
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
                  <p className="text-sm text-gray-600">{user?.phone || supplier?.phone || 'Not provided'}</p>
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

          {/* Store Assignment */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Store Assignment</h3>
            {supplier?.store ? (
              <div className="flex items-center space-x-3">
                <BuildingStorefrontIcon className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Assigned Store</p>
                  <p className="text-sm text-gray-600">{supplier.store.name}</p>
                  <p className="text-xs text-gray-500">Store ID: {supplier.store.slug}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <BuildingStorefrontIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No store assigned</p>
                <p className="text-xs text-gray-500">Contact your store owner to get access</p>
              </div>
            )}
          </div>

          {/* Recent Purchase Orders */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Purchase Orders</h3>
            {purchaseOrders && purchaseOrders.length > 0 ? (
              <div className="space-y-3">
                {purchaseOrders.slice(0, 3).map((po: any) => (
                  <div key={po.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        PO #{po.id.toString().slice(-8)}
                      </p>
                      <p className="text-xs text-gray-600">{po.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">
                        {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No recent purchase orders</p>
            )}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Account Stats */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Stats</h3>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totalPurchaseOrders}</p>
                <p className="text-sm text-gray-600">Total Purchase Orders</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>
            </div>
          </div>
        </div>
      </div>
    </SupplierLayoutClient>
  )
}

