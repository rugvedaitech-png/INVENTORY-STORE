'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { Bars3Icon } from '@heroicons/react/24/outline'

interface SellerLayoutClientProps {
  children: React.ReactNode
  userEmail?: string
  userName?: string
}

export default function SellerLayoutClient({ 
  children, 
  userEmail, 
  userName 
}: SellerLayoutClientProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'purple'>('light')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'purple') => {
    setTheme(newTheme)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex print:block">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-lg hover:bg-gray-100 print:hidden"
        aria-label="Open menu"
        title="Open menu"
      >
        <Bars3Icon className="h-6 w-6 text-gray-600" />
      </button>

      {/* Sidebar */}
      <Sidebar 
        userEmail={userEmail}
        userName={userName}
        theme={theme}
        onThemeChange={handleThemeChange}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      {/* Main content */}
      <div className="flex-1 lg:ml-0 print:w-full">
        <main className="p-4 sm:p-6 print:p-0">
          {children}
        </main>
      </div>
    </div>
  )
}
