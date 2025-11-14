'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  HomeIcon, 
  DocumentTextIcon, 
  TruckIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import ThemeSwitcher from './ThemeSwitcher'
import { signOut } from 'next-auth/react'

interface SupplierSidebarProps {
  userEmail?: string
  userName?: string
  userAvatar?: string
  theme?: 'light' | 'dark' | 'purple'
  onThemeChange?: (theme: 'light' | 'dark' | 'purple') => void
}

type NavigationItem = {
  name: string
  href: string
  icon: typeof HomeIcon
  badge?: string
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/supplier', icon: HomeIcon },
  { name: 'Quotations', href: '/supplier/quotations', icon: DocumentTextIcon },
  { name: 'Purchase Orders', href: '/supplier/purchase-orders', icon: DocumentTextIcon },
]

export default function SupplierSidebar({ 
  userEmail = 'supplier@example.com', 
  userName = 'Supplier User', 
  userAvatar = '/api/placeholder/40/40',
  theme = 'light',
  onThemeChange
}: SupplierSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/login')
  }

  const themeClasses = {
    light: 'bg-white text-gray-900 border-gray-200',
    dark: 'bg-gray-900 text-white border-gray-700',
    purple: 'bg-purple-900 text-white border-purple-700'
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          type="button"
          className={`${themeClasses[theme]} p-2 rounded-md border`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="sr-only">Open sidebar</span>
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block lg:flex-shrink-0`}>
        <div className={`${themeClasses[theme]} flex flex-col h-full border-r`}>
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
            <div className="flex items-center">
              <TruckIcon className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold">Supplier Portal</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-indigo-100 text-indigo-900 border-r-2 border-indigo-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto bg-indigo-100 text-indigo-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User info and theme switcher */}
          <div className="flex-shrink-0 border-t p-4">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-8 rounded-full"
                  src={userAvatar}
                  alt={userName}
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </div>
            
            {/* Theme Switcher */}
            {onThemeChange && (
              <div className="mb-3">
                <ThemeSwitcher currentTheme={theme} onThemeChange={onThemeChange} />
              </div>
            )}
            
            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors group"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-400 group-hover:text-red-500" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
