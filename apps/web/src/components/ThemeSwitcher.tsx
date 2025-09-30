'use client'

import { useState } from 'react'
import { SwatchIcon } from '@heroicons/react/24/outline'

interface ThemeSwitcherProps {
  currentTheme: 'light' | 'dark' | 'purple'
  onThemeChange: (theme: 'light' | 'dark' | 'purple') => void
  className?: string
}

const themes = [
  { id: 'light', name: 'Light', color: 'bg-white border-gray-300' },
  { id: 'dark', name: 'Dark', color: 'bg-gray-900 border-gray-700' },
  { id: 'purple', name: 'Purple', color: 'bg-purple-900 border-purple-700' },
] as const

export default function ThemeSwitcher({ 
  currentTheme, 
  onThemeChange, 
  className = '' 
}: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Change theme"
      >
        <SwatchIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Theme options */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                Choose Theme
              </div>
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onThemeChange(theme.id as 'light' | 'dark' | 'purple')
                    setIsOpen(false)
                  }}
                  className={`
                    w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors
                    ${currentTheme === theme.id 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${theme.color}`} />
                  {theme.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
