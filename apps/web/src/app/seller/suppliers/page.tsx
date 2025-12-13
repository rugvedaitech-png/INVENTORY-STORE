'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import Pagination from '@/components/Pagination'

interface Supplier {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  leadTimeDays: number
  createdAt: string
  updatedAt: string
  userId: number | null
  user: {
    id: number
    email: string
    name: string | null
  } | null
  _count: {
    products: number
    purchaseOrders: number
  }
}

interface SuppliersResponse {
  suppliers: Supplier[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function SuppliersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showLinkUserForm, setShowLinkUserForm] = useState(false)
  const [linkingSupplier, setLinkingSupplier] = useState<Supplier | null>(null)
  const [availableUsers, setAvailableUsers] = useState<{ id: number, name: string, email: string }[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [supplierUsers, setSupplierUsers] = useState<{ id: number, name: string, email: string, phone: string | null }[]>([])
  const [selectedSupplierUserId, setSelectedSupplierUserId] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    leadTimeDays: 3
  })

  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const fetchSuppliers = useCallback(async (storeIdParam?: string, page?: number) => {
    if (!storeId && !storeIdParam) return
    const currentStoreId = storeIdParam || storeId
    const pageToFetch = page || currentPage
    try {
      setLoading(true)
      const response = await fetch(`/api/suppliers?storeId=${currentStoreId}&page=${pageToFetch}&limit=10`)
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers')
      }
      const data: SuppliersResponse = await response.json()
      setSuppliers(data.suppliers || data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }, [storeId, currentPage])

  const fetchStoreId = useCallback(async () => {
    try {
      const response = await fetch('/api/stores')
      if (!response.ok) throw new Error('Failed to fetch stores')
      const data = await response.json()
      const stores = data.stores || data
      if (stores && stores.length > 0) {
        setStoreId(stores[0].id.toString())
        fetchSuppliers(stores[0].id.toString())
      }
    } catch {
      setError('Failed to fetch store information')
    }
  }, [fetchSuppliers])

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/auth/login')
      return
    }
    fetchStoreId()
  }, [session, status, router, fetchStoreId])


  const fetchSupplierUsers = async () => {
    if (!storeId) return
    try {
      const response = await fetch(`/api/auth/users?role=SUPPLIER&storeId=${storeId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch supplier users')
      }
      const data = await response.json()
      setSupplierUsers(data.users || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch supplier users')
    }
  }

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Supplier name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Supplier name must be at least 2 characters'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number'
    }

    if (formData.leadTimeDays < 1 || formData.leadTimeDays > 365) {
      errors.leadTimeDays = 'Lead time must be between 1 and 365 days'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleInputBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateForm()
  }

  const handleUserSelection = (userId: string) => {
    setSelectedSupplierUserId(userId)

    if (userId) {
      const selectedUser = supplierUsers.find(user => user.id.toString() === userId)
      if (selectedUser) {
        setFormData(prev => ({
          ...prev,
          name: selectedUser.name || '',
          email: selectedUser.email,
          phone: selectedUser.phone || ''
        }))
      }
    } else {
      // Reset form data when no user is selected
      setFormData(prev => ({
        ...prev,
        name: '',
        email: '',
        phone: ''
      }))
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '', leadTimeDays: 3 })
    setFormErrors({})
    setTouched({})
    setShowAddForm(false)
    setEditingSupplier(null)
    setSelectedSupplierUserId('')
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchSuppliers(undefined, page)
  }

  const handleLinkUser = async (supplier: Supplier) => {
    if (!storeId) return
    setLinkingSupplier(supplier)
    setShowLinkUserForm(true)

    // Fetch available users with SUPPLIER role for this store
    try {
      const response = await fetch(`/api/auth/users?role=SUPPLIER&storeId=${storeId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(data.users || [])
      }
    } catch {
      setError('Failed to fetch users')
    }
  }

  const handleUnlinkUser = async (supplier: Supplier) => {
    if (!confirm('Are you sure you want to unlink this user from the supplier?')) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/suppliers/${supplier.id}/unlink-user`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unlink user')
      }

      await fetchSuppliers()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLinkUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkingSupplier || !selectedUserId) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/suppliers/${linkingSupplier.id}/link-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(selectedUserId) })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link user')
      }

      await fetchSuppliers()
      setShowLinkUserForm(false)
      setLinkingSupplier(null)
      setSelectedUserId('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId) return

    // Validate form
    if (!validateForm()) {
      setTouched({ name: true, email: true, phone: true, leadTimeDays: true })
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const submitData = {
        ...formData,
        userId: selectedSupplierUserId ? parseInt(selectedSupplierUserId) : undefined
      }

      const response = await fetch(`/api/suppliers?storeId=${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create supplier')
      }

      // Reset form and refresh data
      resetForm()
      fetchSuppliers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supplier')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      leadTimeDays: supplier.leadTimeDays
    })
    setFormErrors({})
    setTouched({})
    setShowAddForm(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSupplier) return

    // Validate form
    if (!validateForm()) {
      setTouched({ name: true, email: true, phone: true, leadTimeDays: true })
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update supplier')
      }

      // Reset form and refresh data
      resetForm()
      fetchSuppliers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update supplier')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete supplier')
      }

      fetchSuppliers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete supplier')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading suppliers...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your suppliers and their information
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(true)
                fetchSupplierUsers()
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <BuildingOfficeIcon className="h-4 w-4 mr-2" />
              Add Supplier
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white shadow-xl rounded-xl border border-gray-200">
          {/* Form Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {editingSupplier ? 'Update supplier information' : 'Enter supplier details to get started'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 py-6">
            <form onSubmit={editingSupplier ? handleUpdate : handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-500" />
                  Basic Information
                </h4>

                {/* User Selection */}
                <div className="sm:col-span-2">
                  <label htmlFor="supplierUser" className="block text-sm font-medium text-gray-700 mb-2">
                    Link to Existing Supplier User (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="supplierUser"
                      value={selectedSupplierUserId}
                      onChange={(e) => handleUserSelection(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    >
                      <option value="">Select a supplier user (optional)</option>
                      {supplierUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Select an existing user with SUPPLIER role to automatically populate name, email, and phone
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Supplier Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Name * {selectedSupplierUserId && <span className="text-green-600 text-xs">(Auto-filled from user)</span>}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        onBlur={() => handleInputBlur('name')}
                        disabled={!!selectedSupplierUserId}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${touched.name && formErrors.name
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300'
                          } ${selectedSupplierUserId ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="Enter supplier name"
                      />
                    </div>
                    {touched.name && formErrors.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address {selectedSupplierUserId && <span className="text-green-600 text-xs">(Auto-filled)</span>}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onBlur={() => handleInputBlur('email')}
                        disabled={!!selectedSupplierUserId}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${touched.email && formErrors.email
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300'
                          } ${selectedSupplierUserId ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="supplier@example.com"
                      />
                    </div>
                    {touched.email && formErrors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number {selectedSupplierUserId && <span className="text-green-600 text-xs">(Auto-filled)</span>}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        onBlur={() => handleInputBlur('phone')}
                        disabled={!!selectedSupplierUserId}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${touched.phone && formErrors.phone
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300'
                          } ${selectedSupplierUserId ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        placeholder="+91 xxxx xxxx xx"
                      />
                    </div>
                    {touched.phone && formErrors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="address"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors resize-none"
                      placeholder="Enter complete address including street, city, state, and postal code"
                    />
                  </div>
                </div>
              </div>

              {/* Business Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                  Business Settings
                </h4>

                <div>
                  <label htmlFor="leadTimeDays" className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Time (Days) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="leadTimeDays"
                      min="1"
                      max="365"
                      value={formData.leadTimeDays}
                      onChange={(e) => handleInputChange('leadTimeDays', parseInt(e.target.value) || 1)}
                      onBlur={() => handleInputBlur('leadTimeDays')}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${touched.leadTimeDays && formErrors.leadTimeDays
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300'
                        }`}
                      placeholder="3"
                    />
                  </div>
                  {touched.leadTimeDays && formErrors.leadTimeDays && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      {formErrors.leadTimeDays}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Average number of days to fulfill orders from this supplier
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingSupplier ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suppliers List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {suppliers.map((supplier) => (
            <li key={supplier.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {supplier.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {supplier.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {supplier.email && `${supplier.email} • `}
                        {supplier.phone && `${supplier.phone} • `}
                        {supplier.leadTimeDays} days lead time
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {supplier._count.products} products • {supplier._count.purchaseOrders} orders
                      </div>
                      <div className="text-xs mt-1">
                        {supplier.user ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Linked to {supplier.user.email}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Not linked to user
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {supplier.user ? (
                      <button
                        onClick={() => handleUnlinkUser(supplier)}
                        disabled={submitting}
                        className="text-orange-600 hover:text-orange-900 text-sm font-medium disabled:opacity-50"
                      >
                        Unlink User
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLinkUser(supplier)}
                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                      >
                        Link User
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {suppliers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No suppliers found. Add your first supplier to get started.</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* User Linking Modal */}
      {showLinkUserForm && linkingSupplier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Link User to {linkingSupplier.name}
                </h3>
                <button
                  onClick={() => {
                    setShowLinkUserForm(false)
                    setLinkingSupplier(null)
                    setSelectedUserId('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleLinkUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a user...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkUserForm(false)
                      setLinkingSupplier(null)
                      setSelectedUserId('')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedUserId}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Linking...' : 'Link User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
