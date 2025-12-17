'use client'

import { ReactNode } from 'react'
import CustomerSidebar from '@/components/CustomerSidebar'
import { CartProvider } from '@/hooks/useCart'

interface CustomerLayoutClientProps {
  children: ReactNode
  userEmail?: string
  userName?: string
}

export default function CustomerLayoutClient({ children, userEmail, userName }: CustomerLayoutClientProps) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <CustomerSidebar userEmail={userEmail} userName={userName} />
        
        {/* Main content */}
        <div className="flex-1 w-full lg:ml-0 pt-16 lg:pt-0">
          <main className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </CartProvider>
  )
}
