'use client'

import { useRef, useEffect } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface BarcodeInputProps {
  value: string
  onChange: (value: string) => void
  onEnter: () => void
  disabled?: boolean
  placeholder?: string
}

export default function BarcodeInput({
  value,
  onChange,
  onEnter,
  disabled = false,
  placeholder = 'Scan barcode or enter SKU...',
}: BarcodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // ⚡ KEEP INPUT ALWAYS FOCUSED (required for scanner)
  useEffect(() => {
    const refocus = () => {
      if (inputRef.current && !disabled) {
        inputRef.current.focus()
      }
    }

    // Focus on load
    refocus()

    // Keep focus even if user clicks or tabs away
    window.addEventListener('click', refocus)
    window.addEventListener('keydown', refocus)

    return () => {
      window.removeEventListener('click', refocus)
      window.removeEventListener('keydown', refocus)
    }
  }, [disabled])

  // Handle barcode scanner ENTER
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      onEnter()

      // 🚀 Clear for next scan
      setTimeout(() => {
        onChange('')
        if (inputRef.current) inputRef.current.focus()
      }, 10)
    }
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 
                   focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                   text-lg font-mono"
        autoFocus
      />
    </div>
  )
}
