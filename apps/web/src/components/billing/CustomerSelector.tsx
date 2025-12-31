'use client'

import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, UserPlusIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface Customer {
  id: number
  name: string
  phone: string
  email: string
}

interface CustomerSelectorProps {
  storeId: number | null
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void
  disabled?: boolean
}

export default function CustomerSelector({
  storeId,
  selectedCustomer,
  onSelectCustomer,
  disabled = false,
}: CustomerSelectorProps) {
  const [phoneSearch, setPhoneSearch] = useState('')
  const [nameSearch, setNameSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ phone?: string; name?: string }>({})
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Validate phone number
  const validatePhone = (phone: string): string | null => {
    const cleaned = phone.replace(/\D/g, '')
    if (!cleaned) return null
    if (cleaned.length < 10) return 'Phone number must be at least 10 digits'
    if (cleaned.length > 15) return 'Phone number cannot exceed 15 digits'
    if (!/^[0-9]+$/.test(cleaned)) return 'Phone number must contain only digits'
    return null
  }

  // Validate name
  const validateName = (name: string): string | null => {
    const trimmed = name.trim()
    if (!trimmed) return null
    if (trimmed.length < 2) return 'Name must be at least 2 characters'
    if (trimmed.length > 100) return 'Name cannot exceed 100 characters'
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return 'Name can only contain letters, spaces, hyphens, and apostrophes'
    return null
  }

  // Auto-search when phone or name is entered (debounced)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Validate inputs
    const phoneError = phoneSearch.trim() ? validatePhone(phoneSearch) : null
    const nameError = nameSearch.trim() ? validateName(nameSearch) : null

    setValidationErrors({
      phone: phoneError || undefined,
      name: nameError || undefined,
    })

    // Only search if we have valid input (phone >= 10 digits OR name >= 2 chars)
    const hasValidPhone = phoneSearch.trim().replace(/\D/g, '').length >= 10
    const hasValidName = nameSearch.trim().length >= 2

    if ((!hasValidPhone && !hasValidName) || !storeId) {
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch()
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneSearch, nameSearch, storeId])

  const handleSearch = async () => {
    if (!storeId) return

    // Check if we have valid search criteria
    const cleanedPhone = phoneSearch.trim().replace(/\D/g, '')
    const hasValidPhone = cleanedPhone.length >= 10
    const hasValidName = nameSearch.trim().length >= 2

    if (!hasValidPhone && !hasValidName) {
      return
    }

    // Check for validation errors
    if (validationErrors.phone || validationErrors.name) {
      return
    }

    setSearching(true)
    setError(null)

    try {
      // Build search query
      const params = new URLSearchParams({
        storeId: storeId.toString(),
        limit: '1',
      })
      if (hasValidPhone) {
        params.append('phone', cleanedPhone)
      }
      if (hasValidName) {
        params.append('name', nameSearch.trim())
      }

      const response = await fetch(`/api/customers?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to search customer')
      }

      const data = await response.json()
      const customers = data.customers || data

      if (customers && customers.length > 0) {
        // Customer found - select them
        onSelectCustomer(customers[0])
        setPhoneSearch('')
        setNameSearch('')
      } else {
        // Customer not found - show create form with pre-filled data
        if (hasValidPhone) {
          setNewCustomerPhone(cleanedPhone)
        }
        if (hasValidName) {
          setNewCustomerName(nameSearch.trim())
        }
        setShowCreateForm(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search customer')
    } finally {
      setSearching(false)
    }
  }

  const handleCreateCustomer = async () => {
    // Validate inputs
    const nameError = validateName(newCustomerName)
    const phoneError = validatePhone(newCustomerPhone)
    const emailError = newCustomerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerEmail.trim())
      ? 'Please enter a valid email address'
      : null

    if (nameError || phoneError || emailError) {
      setError(nameError || phoneError || emailError || 'Please fill in all required fields')
      return
    }

    if (!storeId || !newCustomerName.trim() || !newCustomerPhone.trim()) {
      setError('Name and phone number are required')
      return
    }

    setCreating(true)
    setError(null)

    try {
      // Generate a unique email if not provided
      const email = newCustomerEmail.trim() || `customer_${Date.now()}@pos.local`

      const response = await fetch(`/api/customers?storeId=${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim(),
          email: email,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create customer')
      }

      const customer = await response.json()
      onSelectCustomer(customer)
      setShowCreateForm(false)
      setNewCustomerName('')
      setNewCustomerPhone('')
      setNewCustomerEmail('')
      setPhoneSearch('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer')
    } finally {
      setCreating(false)
    }
  }

  const handleClearCustomer = () => {
    onSelectCustomer(null)
    setPhoneSearch('')
    setNameSearch('')
    setShowCreateForm(false)
    setNewCustomerName('')
    setNewCustomerPhone('')
    setNewCustomerEmail('')
    setError(null)
    setValidationErrors({})
  }

  return (
    <div className="space-y-4">
      {!selectedCustomer && !showCreateForm && (
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Search Customer by Phone Number or Name
        </label>
      )}

      {selectedCustomer ? (
        // Show selected customer
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">{selectedCustomer.name}</p>
              <p className="text-xs text-green-700">{selectedCustomer.phone}</p>
            </div>
          </div>
          <button
            onClick={handleClearCustomer}
            disabled={disabled}
            className="text-green-600 hover:text-green-800 disabled:opacity-50"
            title="Remove customer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : showCreateForm ? (
        // Show create form
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            <UserPlusIcon className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">Create New Customer</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              disabled={creating || disabled}
              maxLength={100}
              className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter customer name"
              autoFocus
            />
            {validationErrors.name && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={newCustomerPhone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setNewCustomerPhone(value)
              }}
              disabled={creating || disabled}
              maxLength={15}
              className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 ${
                validationErrors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter phone number (digits only)"
            />
            {validationErrors.phone && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              value={newCustomerEmail}
              onChange={(e) => setNewCustomerEmail(e.target.value)}
              disabled={creating || disabled}
              className={`w-full px-3 py-2 border rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter email (optional)"
            />
            {newCustomerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerEmail.trim()) && (
              <p className="mt-1 text-xs text-red-600">Please enter a valid email address</p>
            )}
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleCreateCustomer}
              disabled={creating || disabled || !newCustomerName.trim() || !newCustomerPhone.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create & Add'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setNewCustomerName('')
                setNewCustomerPhone('')
                setNewCustomerEmail('')
                setError(null)
              }}
              disabled={creating || disabled}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // Show search inputs - Phone and Name fields
        <div className="space-y-4">
          {/* Phone Number Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-gray-500">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={phoneSearch}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setPhoneSearch(value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                disabled={disabled || searching}
                autoFocus
                maxLength={15}
                className={`block w-full pl-12 pr-3 py-3 border-2 rounded-lg text-base text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 shadow-sm ${
                  validationErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter phone number (e.g., 9876543210)"
              />
              {searching && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {validationErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
            )}
            {!validationErrors.phone && phoneSearch && (
              <p className="mt-1 text-xs text-gray-500">
                Enter at least 10 digits to search
              </p>
            )}
          </div>

          {/* Name Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-gray-500">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={nameSearch}
                onChange={(e) => {
                  const value = e.target.value
                  setNameSearch(value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                disabled={disabled || searching}
                maxLength={100}
                className={`block w-full pl-12 pr-3 py-3 border-2 rounded-lg text-base text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 shadow-sm ${
                  validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter customer name"
              />
            </div>
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
            )}
            {!validationErrors.name && nameSearch && (
              <p className="mt-1 text-xs text-gray-500">
                Enter at least 2 characters to search
              </p>
            )}
          </div>

          {/* Search Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Enter either phone number (10+ digits) or name (2+ characters) to search. You can also enter both for more accurate results.
            </p>
          </div>
        </div>
      )}

      {error && !showCreateForm && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

