'use client'

import { useState } from 'react'
import SupplierSidebar from '@/components/SupplierSidebar'

interface SupplierLayoutClientProps {
  children: React.ReactNode
  userEmail: string
  userName: string
}

export default function SupplierLayoutClient({
  children,
  userEmail,
  userName,
}: SupplierLayoutClientProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'purple'>('light')

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'purple') => {
    setTheme(newTheme)
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <SupplierSidebar
        userEmail={userEmail}
        userName={userName}
        theme={theme}
        onThemeChange={handleThemeChange}
      />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
