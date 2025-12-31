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
  // But don't interfere with other form inputs
  useEffect(() => {
    const refocus = (e?: Event) => {
      if (inputRef.current && !disabled) {
        // Check if user is interacting with another input field
        const activeElement = document.activeElement
        const isInputField = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.getAttribute('contenteditable') === 'true'
        )

        // Don't refocus if user is typing in another input
        if (!isInputField) {
          // Only refocus if the barcode input is not already focused
          if (activeElement !== inputRef.current) {
            inputRef.current.focus()
          }
        }
      }
    }

    // Focus on load (only if no other input is focused)
    const timer = setTimeout(() => {
      const activeElement = document.activeElement
      const isInputField = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT'
      )
      if (!isInputField && inputRef.current && !disabled) {
        inputRef.current.focus()
      }
    }, 100)

    // Keep focus when clicking outside of input fields
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInputField = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.closest('input, textarea, select')
      )
      
      // Only refocus if clicking outside of input fields
      if (!isInputField) {
        refocus(e)
      }
    }

    // Only refocus on keydown if it's not a typing key in another input
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isInputField = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT'
      )

      // Don't refocus if user is typing in another input
      // Only refocus for navigation keys (Tab, Escape) when not in an input
      if (!isInputField && (e.key === 'Tab' || e.key === 'Escape')) {
        refocus(e)
      }
    }

    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
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
                   text-lg font-mono text-gray-900"
        autoFocus
      />
    </div>
  )
}
