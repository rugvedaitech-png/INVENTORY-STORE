import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CogIcon } from '@heroicons/react/24/outline'
import ChangePassword from '@/components/ChangePassword'
import StoreSettings from '@/components/StoreSettings'

// Temporary fix for UserRole import issue
enum UserRole {
  STORE_OWNER = 'STORE_OWNER',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== UserRole.STORE_OWNER) {
    redirect('/unauthorized')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <CogIcon className="h-8 w-8 mr-3 text-gray-600" />
              Store Settings
            </h1>
            <p className="mt-2 text-gray-600">
              Configure your store settings and account preferences
            </p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
          <div className="space-y-4">
            <ChangePassword />
          </div>
        </div>

        {/* Store Settings */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Store Settings</h3>
          <StoreSettings />
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">More Settings Coming Soon</h3>
        <p className="text-sm text-blue-700">
          We're working on adding more customization options for your store. 
          Stay tuned for updates!
        </p>
      </div>
    </div>
  )
}

