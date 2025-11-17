'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import CartSidebar from './CartSidebar'
import {
  HomeIcon,
  ShoppingBagIcon,
  UserIcon,
  ShoppingCartIcon,
  HeartIcon,
  BellIcon,
  XMarkIcon,
  Bars3Icon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  GiftIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { signOut } from 'next-auth/react'

interface CustomerSidebarProps {
  userEmail?: string
  userName?: string
  onClose?: () => void
}

export default function CustomerSidebar({ userEmail, userName, onClose }: CustomerSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { getTotalItems } = useCart()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/login')
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/customer', icon: HomeIcon, description: 'Overview & Summary' },
    { name: 'Shop', href: '/customer/shop', icon: ShoppingCartIcon, description: 'Browse & buy products' },
    { name: 'Order Tracking', href: '/customer/order-tracking', icon: TruckIcon, description: 'Track your orders' },
    { name: 'My Orders', href: '/customer/orders', icon: ShoppingBagIcon, description: 'Order history' },
    { name: 'Order Summary', href: '/customer/order-summary', icon: DocumentTextIcon, description: 'Order details' },
    { name: 'Wishlist', href: '/customer/wishlist', icon: HeartIcon, description: 'Saved items' },
    { name: 'Profile', href: '/customer/profile', icon: UserIcon, description: 'Account settings' },
    { name: 'Addresses', href: '/customer/addresses', icon: MapPinIcon, description: 'Delivery addresses' },
    { name: 'Payment Methods', href: '/customer/payment-methods', icon: CreditCardIcon, description: 'Payment options' },
    { name: 'Notifications', href: '/customer/notifications', icon: BellIcon, description: 'Order updates' },
    { name: 'Support', href: '/customer/support', icon: ChatBubbleLeftRightIcon, description: 'Help & support' },
    { name: 'Returns', href: '/customer/returns', icon: ArrowPathIcon, description: 'Return items' },
  ]

  const isActive = (href: string) => {
    if (href === '/customer') {
      return pathname === '/customer'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white p-2 rounded-md shadow-lg border border-gray-200"
        >
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-0 lg:shadow-none lg:border-r lg:border-gray-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <ShoppingCartIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Customer Portal</h2>
                <p className="text-xs text-gray-500">Shopping Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userName || 'Customer User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userEmail || 'customer@example.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Cart Button */}
          <div className="px-6 py-4 border-b border-gray-200">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <ShoppingCartIcon className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-blue-900">Shopping Cart</span>
              </div>
              {getTotalItems() > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group flex items-start px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-r-2 border-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                    }
                  `}
                >
                  <Icon
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0 mt-0.5
                      ${isActive(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{item.name}</div>
                    <div className={`text-xs mt-0.5 ${
                      isActive(item.href) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/customer/order-tracking"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-white hover:text-gray-900 transition-colors group"
              >
                <TruckIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                <div>
                  <div className="font-medium">Track Order</div>
                  <div className="text-xs text-gray-500">Check delivery status</div>
                </div>
              </Link>
              <Link
                href="/customer/support"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-white hover:text-gray-900 transition-colors group"
              >
                <ChatBubbleLeftRightIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                <div>
                  <div className="font-medium">Get Help</div>
                  <div className="text-xs text-gray-500">Contact support</div>
                </div>
              </Link>
            </div>
            
            {/* Sign Out */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors group"
              >
                <XMarkIcon className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" />
                <div>
                  <div className="font-medium">Sign Out</div>
                  <div className="text-xs text-red-500">Logout from account</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
