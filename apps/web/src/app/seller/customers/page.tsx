'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BuildingOfficeIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, XMarkIcon, CheckIcon, UserIcon, EyeIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import Pagination from '@/components/Pagination'

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string | null
  userId: number | null
  user: { id: number; email: string; name: string | null } | null
  createdAt: string
  updatedAt: string
}

interface CustomersResponse {
  customers: Customer[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export default function CustomersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filterEmail, setFilterEmail] = useState('')
  const [filterPhone, setFilterPhone] = useState('')

  const [customerUsers, setCustomerUsers] = useState<{ id: number; name: string | null; email: string }[]>([])
  const [selectedCustomerUserId, setSelectedCustomerUserId] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<{ id: number; name: string | null; email: string }[]>([])
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // CSV Import/Export
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<any>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Customer invite
  const [inviteResults, setInviteResults] = useState<{customerId: number, inviteLink: string, expiresAt: string} | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' })

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Valid email required'
    if (!formData.phone.trim()) errors.phone = 'Phone is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleInputBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateForm()
  }

  const fetchCustomers = useCallback(async (storeIdParam?: string, page?: number) => {
    if (!storeId && !storeIdParam) return
    const currentStoreId = storeIdParam || storeId
    const pageToFetch = page || currentPage
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('storeId', String(currentStoreId))
      params.append('page', String(pageToFetch))
      params.append('limit', '10')
      if (searchTerm) params.append('search', searchTerm)
      if (filterName) params.append('name', filterName)
      if (filterEmail) params.append('email', filterEmail)
      if (filterPhone) params.append('phone', filterPhone)
      const res = await fetch(`/api/customers?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data: CustomersResponse = await res.json()
      setCustomers(data.customers)
      setPagination(data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch customers')
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
        fetchCustomers(stores[0].id.toString())
      }
    } catch {
      setError('Failed to fetch store information')
    }
  }, [fetchCustomers])

  const fetchCustomerUsers = async (search = '') => {
    try {
      const params = new URLSearchParams()
      params.append('role', 'CUSTOMER')
      params.append('limit', '20')
      if (search) params.append('search', search)
      
      const res = await fetch(`/api/auth/users?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      const users = data.users || []
      if (search) {
        setUserSearchResults(users)
      } else {
        setCustomerUsers(users)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch users')
    }
  }

  const searchUsers = async (search: string) => {
    if (search.length >= 2) {
      await fetchCustomerUsers(search)
      setShowUserDropdown(true)
    } else {
      setUserSearchResults([])
      setShowUserDropdown(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/auth/login')
      return
    }
    if (session.user.role !== 'STORE_OWNER') {
      router.push('/unauthorized')
      return
    }
    fetchStoreId()
  }, [session, status, router, fetchStoreId])

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '' })
    setTouched({})
    setFormErrors({})
    setShowForm(false)
    setEditingCustomer(null)
    setSelectedCustomerUserId('')
    setUserSearchTerm('')
    setUserSearchResults([])
    setShowUserDropdown(false)
  }

  const handleUserSelection = (userId: string) => {
    setSelectedCustomerUserId(userId)
    if (userId) {
      const user = customerUsers.find(u => u.id.toString() === userId)
      if (user) {
        setFormData(prev => ({ ...prev, name: user.name || '', email: user.email }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId) return
    if (!validateForm()) { setTouched({ name: true, email: true, phone: true }); return }
    try {
      setSubmitting(true)
      const res = await fetch(`/api/customers?storeId=${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: selectedCustomerUserId ? parseInt(selectedCustomerUserId) : undefined })
      })
      if (!res.ok) {
        const err = await res.json(); throw new Error(err.error || 'Failed to create customer')
      }
      resetForm(); fetchCustomers()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create customer')
    } finally { setSubmitting(false) }
  }

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c)
    setFormData({ name: c.name, email: c.email, phone: c.phone, address: c.address || '' })
    setShowForm(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return
    if (!validateForm()) { setTouched({ name: true, email: true, phone: true }); return }
    try {
      setSubmitting(true)
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update customer') }
      resetForm(); fetchCustomers()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update customer')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this customer?')) return
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchCustomers()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete customer') }
  }

  const handleLink = async (customer: Customer) => {
    await fetchCustomerUsers()
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleUnlink = async (customer: Customer) => {
    if (!confirm('Unlink user from this customer?')) return
    try {
      const res = await fetch(`/api/customers/${customer.id}/link-user`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to unlink') }
      fetchCustomers()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to unlink user') }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchCustomers(undefined, page)
  }

  const handleExport = async () => {
    if (!storeId) return
    try {
      const response = await fetch(`/api/customers/export?storeId=${storeId}`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    }
  }

  const handleImport = async () => {
    if (!importFile || !storeId) return
    
    try {
      setIsImporting(true)
      const formData = new FormData()
      formData.append('file', importFile)
      
      const response = await fetch(`/api/customers/import?storeId=${storeId}`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Import failed')
      }
      
      const results = await response.json()
      setImportResults(results)
      
      // Refresh customers list
      fetchCustomers()
      
      // Reset import state
      setImportFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const handleInvite = async (customer: Customer) => {
    try {
      const response = await fetch(`/api/customers/${customer.id}/invite`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate invitation')
      }
      
      const results = await response.json()
      setInviteResults({
        customerId: customer.id,
        inviteLink: results.inviteLink,
        expiresAt: results.expiresAt
      })
      setShowInviteModal(true)
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate invitation')
    }
  }

  const copyInviteLink = () => {
    if (inviteResults?.inviteLink) {
      navigator.clipboard.writeText(inviteResults.inviteLink)
      // You could add a toast notification here
    }
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    if (!storeId) return
    setCurrentPage(1)
    fetchCustomers(storeId, 1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterName, filterEmail, filterPhone])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (status === 'loading' || loading) {
    return (<div className="flex items-center justify-center h-64"><div className="text-lg text-gray-600">Loading customers...</div></div>)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Search (name/email/phone)" className="px-3 py-2 border rounded-lg" />
          <input value={filterName} onChange={(e)=>setFilterName(e.target.value)} placeholder="Filter by name" className="px-3 py-2 border rounded-lg" />
          <input value={filterEmail} onChange={(e)=>setFilterEmail(e.target.value)} placeholder="Filter by email" className="px-3 py-2 border rounded-lg" />
          <input value={filterPhone} onChange={(e)=>setFilterPhone(e.target.value)} placeholder="Filter by phone" className="px-3 py-2 border rounded-lg" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg"><UserIcon className="h-6 w-6 text-blue-600" /></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                <p className="mt-1 text-sm text-gray-600">Manage customers and link to user accounts</p>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" /> Import CSV
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(true); fetchCustomerUsers() }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <UserIcon className="h-4 w-4 mr-2" /> Add Customer
            </button>
          </div>
        </div>
      </div>

      {error && (<div className="bg-red-50 border border-red-200 rounded-md p-4"><div className="text-sm text-red-800">{error}</div></div>)}

      {showForm && (
        <div className="bg-white shadow-xl rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg"><UserIcon className="h-6 w-6 text-blue-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
                <p className="text-sm text-gray-600">{editingCustomer ? 'Update customer' : 'Enter customer details'}</p>
              </div>
            </div>
            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><XMarkIcon className="h-5 w-5" /></button>
          </div>
          <div className="px-6 py-6">
            <form onSubmit={editingCustomer ? handleUpdate : handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 flex items-center"><UserIcon className="h-4 w-4 mr-2 text-gray-500" /> Basic Information</h4>

                {/* User Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link to Existing Customer User (Optional)</label>
                  <div className="relative" ref={dropdownRef}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-gray-400" /></div>
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value)
                        searchUsers(e.target.value)
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Search for customer user by name or email..."
                    />
                    {showUserDropdown && (userSearchResults.length > 0 || userSearchTerm.length >= 2) && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {userSearchResults.length === 0 && userSearchTerm.length >= 2 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No users found</div>
                        ) : (
                          userSearchResults.map(user => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomerUserId(user.id.toString())
                                setUserSearchTerm(user.name || user.email)
                                setShowUserDropdown(false)
                                handleUserSelection(user.id.toString())
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100"
                            >
                              <div className="font-medium">{user.name || user.email}</div>
                              <div className="text-gray-500">{user.email}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Type to search for users with CUSTOMER role
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name * {selectedCustomerUserId && <span className="text-green-600 text-xs">(Auto-filled)</span>}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-gray-400" /></div>
                      <input type="text" required value={formData.name} onChange={(e)=>handleInputChange('name', e.target.value)} onBlur={()=>handleInputBlur('name')} disabled={!!selectedCustomerUserId}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg ${touched.name && formErrors.name ? 'border-red-300' : 'border-gray-300'} ${selectedCustomerUserId ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email * {selectedCustomerUserId && <span className="text-green-600 text-xs">(Auto-filled)</span>}</label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><EnvelopeIcon className="h-5 w-5 text-gray-400" /></div>
                      <input type="email" value={formData.email} onChange={(e)=>handleInputChange('email', e.target.value)} onBlur={()=>handleInputBlur('email')} disabled={!!selectedCustomerUserId}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg ${touched.email && formErrors.email ? 'border-red-300' : 'border-gray-300'} ${selectedCustomerUserId ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><PhoneIcon className="h-5 w-5 text-gray-400" /></div>
                      <input type="tel" value={formData.phone} onChange={(e)=>handleInputChange('phone', e.target.value)} onBlur={()=>handleInputBlur('phone')}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg ${touched.phone && formErrors.phone ? 'border-red-300' : 'border-gray-300'}`} />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <div className="relative"><div className="absolute top-3 left-3 pointer-events-none"><MapPinIcon className="h-5 w-5 text-gray-400" /></div>
                      <textarea rows={3} value={formData.address} onChange={(e)=>handleInputChange('address', e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg resize-none" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button type="button" onClick={resetForm} className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg flex items-center">
                  {submitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>{editingCustomer ? 'Updating...' : 'Adding...'}</>) : (<><CheckIcon className="h-4 w-4 mr-2" />{editingCustomer ? 'Update Customer' : 'Add Customer'}</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {customers.map((customer) => (
            <li key={customer.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-blue-600 font-medium text-sm">{customer.name.charAt(0).toUpperCase()}</span></div></div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email} • {customer.phone}</div>
                      <div className="text-xs mt-1">{customer.user ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Linked to {customer.user.email}</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Not linked to user</span>
                      )}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/seller/customers/${customer.id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    {customer.user ? (
                      <button onClick={() => handleUnlink(customer)} className="text-orange-600 hover:text-orange-900 text-sm font-medium">Unlink User</button>
                    ) : (
                      <>
                        <button onClick={() => handleInvite(customer)} className="text-purple-600 hover:text-purple-900 text-sm font-medium flex items-center">
                          <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                          Invite
                        </button>
                        <button onClick={() => handleLink(customer)} className="text-green-600 hover:text-green-900 text-sm font-medium">Link User</button>
                      </>
                    )}
                    <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-900 text-sm font-medium">Edit</button>
                    <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Delete</button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {customers.length === 0 && (<div className="text-center py-12"><div className="text-gray-500">No customers found. Add your first customer.</div></div>)}
      </div>

      {pagination.pages > 1 && (
        <Pagination currentPage={currentPage} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={handlePageChange} />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Import Customers from CSV</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                    setImportResults(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Required columns: Name, Email, Phone. Optional: Address
                  </p>
                </div>

                {importResults && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="text-sm text-green-800">
                      <div className="font-medium">{importResults.message}</div>
                      {importResults.results.errors.length > 0 && (
                        <div className="mt-2">
                          <div className="font-medium text-red-800">Errors:</div>
                          <ul className="mt-1 list-disc list-inside text-red-700">
                            {importResults.results.errors.slice(0, 5).map((error: string, i: number) => (
                              <li key={i} className="text-xs">{error}</li>
                            ))}
                            {importResults.results.errors.length > 5 && (
                              <li className="text-xs">... and {importResults.results.errors.length - 5} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false)
                      setImportFile(null)
                      setImportResults(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!importFile || isImporting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                        Import
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && inviteResults && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Customer Invitation Generated</h3>
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteResults(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="text-sm text-green-800">
                    <div className="font-medium">Invitation link generated successfully!</div>
                    <div className="mt-1">Expires: {new Date(inviteResults.expiresAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invitation Link</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={inviteResults.inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-r-md hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Send this link to the customer to create their account
                  </p>
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false)
                      setInviteResults(null)
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


