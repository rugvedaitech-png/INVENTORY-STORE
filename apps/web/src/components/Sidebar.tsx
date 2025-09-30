'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import ThemeSwitcher from './ThemeSwitcher'
import { signOut } from 'next-auth/react'

interface SidebarProps {
  userEmail?: string
  userName?: string
  userAvatar?: string
  theme?: 'light' | 'dark' | 'purple'
  onThemeChange?: (theme: 'light' | 'dark' | 'purple') => void
}

const navigationItems = [
  { name: 'Dashboard', href: '/seller', icon: HomeIcon },
  { name: 'Products', href: '/seller/products', icon: DocumentTextIcon },
  { name: 'Orders', href: '/seller/orders', icon: CalendarIcon, badge: '4' },
  { name: 'Inventory', href: '/seller/inventory', icon: ChartBarIcon, badge: '5' },
  { name: 'Customers', href: '/seller/customers', icon: UsersIcon },
  { name: 'Categories', href: '/seller/categories', icon: DocumentTextIcon },
  { name: 'Suppliers', href: '/seller/suppliers', icon: UsersIcon },
  { name: 'Purchase Orders', href: '/seller/purchase-orders', icon: DocumentTextIcon },
  { name: 'Reports', href: '/seller/reports', icon: ChartBarIcon },
  { name: 'Analytics', href: '/seller/analytics', icon: ChartBarIcon },
  { name: 'Users', href: '/seller/users', icon: UsersIcon },
  { name: 'Settings', href: '/seller/settings', icon: CogIcon },
]


export default function Sidebar({ 
  userEmail = 'user@example.com', 
  userName = 'Dianne Robertson', 
  userAvatar = '/api/placeholder/40/40',
  theme = 'light',
  onThemeChange
}: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const themeClasses = {
    light: {
      sidebar: 'bg-white text-gray-900',
      navItem: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
      navItemActive: 'text-gray-900 bg-gray-100',
      userSection: 'text-gray-900',
      userSubtext: 'text-gray-500',
      badge: 'bg-gray-100 text-gray-600',
      mobileOverlay: 'bg-black bg-opacity-50'
    },
    dark: {
      sidebar: 'bg-gray-900 text-white',
      navItem: 'text-gray-300 hover:text-white hover:bg-gray-800',
      navItemActive: 'text-white bg-gray-800',
      userSection: 'text-white',
      userSubtext: 'text-gray-400',
      badge: 'bg-gray-700 text-gray-300',
      mobileOverlay: 'bg-black bg-opacity-75'
    },
    purple: {
      sidebar: 'bg-purple-900 text-white',
      navItem: 'text-gray-300 hover:text-white hover:bg-purple-800',
      navItemActive: 'text-white bg-purple-800',
      userSection: 'text-white',
      userSubtext: 'text-gray-400',
      badge: 'bg-purple-700 text-white',
      mobileOverlay: 'bg-black bg-opacity-75'
    }
  }

  const currentTheme = themeClasses[theme]

  const isActive = (href: string) => {
    if (href === '/seller') {
      return pathname === '/seller'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`p-2 rounded-md ${currentTheme.sidebar} shadow-lg`}
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className={`lg:hidden fixed inset-0 z-40 ${currentTheme.mobileOverlay}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${currentTheme.sidebar}
        shadow-xl lg:shadow-none
      `}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-semibold">
              Seller Dashboard
            </h1>
            {onThemeChange && (
              <ThemeSwitcher 
                currentTheme={theme} 
                onThemeChange={onThemeChange}
              />
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active ? currentTheme.navItemActive : currentTheme.navItem}
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className={`
                      ml-2 px-2 py-1 text-xs rounded-full
                      ${currentTheme.badge}
                    `}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>


          {/* User Profile Section */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <img
                  className="h-10 w-10 rounded-full"
                  src={userAvatar}
                  alt={userName}
                />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className={`text-sm font-medium ${currentTheme.userSection}`}>
                  {userName}
                </p>
                <p className={`text-xs ${currentTheme.userSubtext}`}>
                  {userEmail}
                </p>
              </div>
              <button className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                <CogIcon className="h-4 w-4" />
              </button>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className={`
                w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${currentTheme.navItem} hover:bg-red-50 hover:text-red-700
              `}
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
