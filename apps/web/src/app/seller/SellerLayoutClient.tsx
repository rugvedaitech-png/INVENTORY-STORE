'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

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

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'purple') => {
    setTheme(newTheme)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex print:block">
      {/* Sidebar */}
      <Sidebar 
        userEmail={userEmail}
        userName={userName}
        theme={theme}
        onThemeChange={handleThemeChange}
      />
      
      {/* Main content */}
      <div className="flex-1 lg:ml-0 print:w-full">
        <main className="p-6 print:p-0">
          {children}
        </main>
      </div>
    </div>
  )
}
