'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  DocumentTextIcon, 
  BuildingOfficeIcon, 
  PlusIcon, 
  TrashIcon, 
  XMarkIcon,
  CheckIcon,
  CurrencyRupeeIcon,
  CubeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import Pagination from '@/components/Pagination'

interface PurchaseOrder {
  id: number
  code: string
  status:
    | 'DRAFT'
    | 'SENT'
    | 'SHIPPED'
    | 'PARTIAL'
    | 'RECEIVED'
    | 'REJECTED'
    | 'CLOSED'
    | 'CANCELLED'
    | 'QUOTATION_REQUESTED'
    | 'QUOTATION_SUBMITTED'
    | 'QUOTATION_APPROVED'
    | 'QUOTATION_REJECTED'
    | 'QUOTATION_REVISION_REQUESTED'
  notes: string | null
  quotationNotes: string | null
  subtotal: number
  taxTotal: number
  total: number
  placedAt: string | null
  createdAt: string
  updatedAt: string
  supplier: {
    id: number
    name: string
    email: string | null
    phone: string | null
  }
  items: {
    id: number
    productId: number
    qty: number
    costPaise: number
    quotedCostPaise: number | null
    product: {
      id: number
      title: string
      sku: string | null
    }
  }[]
}

interface Product {
  id: number
  title: string
  sku: string | null
  costPrice: number | null
}

interface Supplier {
  id: number
  name: string
  email: string | null
  phone: string | null
}

interface PurchaseOrdersResponse {
  purchaseOrders: PurchaseOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function PurchaseOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirming, setConfirming] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<'received' | 'rejected' | null>(null)
  const [confirmNotes, setConfirmNotes] = useState('')
  const [sending, setSending] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [expandedPoId, setExpandedPoId] = useState<number | null>(null)
  const [revisionModalPo, setRevisionModalPo] = useState<PurchaseOrder | null>(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [revisionSubmitting, setRevisionSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    supplierId: '',
    notes: '',
    items: [{ productId: '', qty: 1 }]
  })

  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/auth/login')
      return
    }
    fetchStoreId()
  }, [session, status, router])

  const fetchStoreId = async () => {
    try {
      const response = await fetch('/api/stores')
      if (!response.ok) throw new Error('Failed to fetch stores')
      const data = await response.json()
      const stores = data.stores || data
      if (stores && stores.length > 0) {
        setStoreId(stores[0].id.toString())
        await Promise.all([
          fetchPurchaseOrders(stores[0].id.toString()),
          fetchSuppliers(stores[0].id.toString()),
          fetchProducts(stores[0].id.toString())
        ])
      }
    } catch (err) {
      setError('Failed to fetch store information')
    }
  }

  const fetchPurchaseOrders = useCallback(async (storeIdParam?: string, page?: number) => {
    if (!storeId && !storeIdParam) return
    const currentStoreId = storeIdParam || storeId
    const pageToFetch = page || currentPage
    try {
      setLoading(true)
      const response = await fetch(`/api/purchase-orders?storeId=${currentStoreId}&page=${pageToFetch}&limit=10`)
      if (!response.ok) throw new Error('Failed to fetch purchase orders')
      const data: PurchaseOrdersResponse = await response.json()
      setPurchaseOrders(data.purchaseOrders || data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchase orders')
    } finally {
      setLoading(false)
    }
  }, [storeId, currentPage])

  const fetchSuppliers = async (storeIdParam?: string) => {
    if (!storeId && !storeIdParam) return
    const currentStoreId = storeIdParam || storeId
    try {
      const response = await fetch(`/api/suppliers?storeId=${currentStoreId}`)
      if (!response.ok) throw new Error('Failed to fetch suppliers')
      const data = await response.json()
      setSuppliers(data.suppliers || data)
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchPurchaseOrders(undefined, page)
  }

  const fetchProducts = async (storeIdParam?: string) => {
    if (!storeId && !storeIdParam) return
    const currentStoreId = storeIdParam || storeId
    try {
      const response = await fetch(`/api/products?storeId=${currentStoreId}`)
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data.products || data)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }

  const togglePurchaseOrderDetails = (poId: number) => {
    setExpandedPoId(prev => (prev === poId ? null : poId))
  }

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) {
      return '₹0.00'
    }
    return `₹${(value / 100).toFixed(2)}`
  }

  const openRevisionModal = (po: PurchaseOrder) => {
    setRevisionModalPo(po)
    setRevisionNotes(po.quotationNotes || '')
  }

  const closeRevisionModal = () => {
    setRevisionModalPo(null)
    setRevisionNotes('')
    setRevisionSubmitting(false)
  }

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.supplierId) {
      errors.supplierId = 'Please select a supplier'
    }

    if (!formData.items.length) {
      errors.items = 'At least one item is required'
    } else {
      formData.items.forEach((item, index) => {
        if (!item.productId) {
          errors[`item_${index}_product`] = 'Please select a product'
        }
        if (!item.qty || item.qty < 1) {
          errors[`item_${index}_qty`] = 'Quantity must be at least 1'
        }
      })
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

  const resetForm = () => {
    setFormData({
      supplierId: '',
      notes: '',
      items: [{ productId: '', qty: 1 }]
    })
    setFormErrors({})
    setTouched({})
    setShowCreateForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId) return

    // Validate form
    if (!validateForm()) {
      setTouched({ supplierId: true, items: true })
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/purchase-orders?storeId=${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create purchase order')
      }

      // Reset form and refresh data
      resetForm()
      fetchPurchaseOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase order')
    } finally {
      setSubmitting(false)
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', qty: 1 }]
    })
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      })
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'QUOTATION_REQUESTED': return 'bg-yellow-100 text-yellow-800'
      case 'QUOTATION_SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'QUOTATION_REVISION_REQUESTED': return 'bg-amber-100 text-amber-800'
      case 'QUOTATION_APPROVED': return 'bg-green-100 text-green-800'
      case 'QUOTATION_REJECTED': return 'bg-red-100 text-red-800'
      case 'SENT': return 'bg-indigo-100 text-indigo-800'
      case 'SHIPPED': return 'bg-blue-100 text-blue-800'
      case 'PARTIAL': return 'bg-blue-100 text-blue-800'
      case 'RECEIVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'CLOSED': return 'bg-purple-100 text-purple-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleRequestQuotation = async (poId: number) => {
    try {
      setSending(poId)
      setError(null)
      
      const response = await fetch(`/api/purchase-orders/${poId}/request-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to request quotation')
      }

      await fetchPurchaseOrders()
      setSending(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request quotation')
    } finally {
      setSending(null)
    }
  }

  const handleApproveQuotation = async (poId: number) => {
    try {
      setConfirming(poId)
      setError(null)
      
      const response = await fetch(`/api/purchase-orders/${poId}/approve-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve quotation')
      }

      await fetchPurchaseOrders()
      setConfirming(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve quotation')
    } finally {
      setConfirming(null)
    }
  }

  const handleRejectQuotation = async (poId: number) => {
    try {
      setConfirming(poId)
      setError(null)
      
      const response = await fetch(`/api/purchase-orders/${poId}/reject-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject quotation')
      }

      await fetchPurchaseOrders()
      setConfirming(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject quotation')
    } finally {
      setConfirming(null)
    }
  }

  const handleConfirmOrder = async (poId: number, action: 'received' | 'rejected') => {
    try {
      setConfirming(poId)
      setError(null)
      
      const response = await fetch(`/api/purchase-orders/${poId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: action,
          notes: confirmNotes 
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} order`)
      }

      await fetchPurchaseOrders()
      setConfirmNotes('')
      setConfirming(null)
      setConfirmAction(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} order`)
    } finally {
      setConfirming(null)
    }
  }

  const handleSubmitRevisionRequest = async () => {
    if (!revisionModalPo) return

    try {
      setRevisionSubmitting(true)
      setError(null)

      const response = await fetch(`/api/purchase-orders/${revisionModalPo.id}/request-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: revisionNotes })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to request revision')
      }

      closeRevisionModal()
      await fetchPurchaseOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request revision')
    } finally {
      setRevisionSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading purchase orders...</div>
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
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Create and manage purchase orders with suppliers
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Create Purchase Order
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

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white shadow-xl rounded-xl border border-gray-200">
          {/* Form Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create Purchase Order
                  </h3>
                  <p className="text-sm text-gray-600">
                    Add supplier details and items for your purchase order
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-500" />
                  Order Information
                </h4>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Supplier Selection */}
                  <div className="sm:col-span-2">
                    <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="supplierId"
                        required
                        value={formData.supplierId}
                        onChange={(e) => handleInputChange('supplierId', e.target.value)}
                        onBlur={() => handleInputBlur('supplierId')}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
                          touched.supplierId && formErrors.supplierId
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select a supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {touched.supplierId && formErrors.supplierId && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        {formErrors.supplierId}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors resize-none"
                      placeholder="Add any additional notes or special instructions for this purchase order"
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <CubeIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Order Items *
                  </h4>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Item
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {/* Product Selection */}
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CubeIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
                              touched[`item_${index}_product`] && formErrors[`item_${index}_product`]
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select product</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.title} {product.sku && `(${product.sku})`}
                              </option>
                            ))}
                          </select>
                        </div>
                        {touched[`item_${index}_product`] && formErrors[`item_${index}_product`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            {formErrors[`item_${index}_product`]}
                          </p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
                          className={`block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
                            touched[`item_${index}_qty`] && formErrors[`item_${index}_qty`]
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300'
                          }`}
                        />
                        {touched[`item_${index}_qty`] && formErrors[`item_${index}_qty`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            {formErrors[`item_${index}_qty`]}
                          </p>
                        )}
                      </div>

                    </div>

                    {/* Remove Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Remove Item
                      </button>
                    </div>
                  </div>
                ))}

                {touched.items && formErrors.items && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    {formErrors.items}
                  </p>
                )}
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Create Purchase Order
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Orders List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {purchaseOrders.map((po) => {
            const isExpanded = expandedPoId === po.id

            return (
              <li key={po.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-start justify-between">
                      <button
                        type="button"
                        onClick={() => togglePurchaseOrderDetails(po.id)}
                        className="flex items-center text-left focus:outline-none"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">PO</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">
                              {po.code}
                            </div>
                            {isExpanded ? (
                              <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {po.supplier.name} • {po.items.length} items • {formatCurrency(po.total)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Created: {new Date(po.createdAt).toLocaleDateString()}
                            {po.placedAt && ` • Placed: ${new Date(po.placedAt).toLocaleDateString()}`}
                          </div>
                        </div>
                      </button>

                      <div className="flex flex-col items-end space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>
                          {po.status.replace(/_/g, ' ')}
                        </span>

                        {po.status === 'DRAFT' && (
                          <button
                            onClick={() => handleRequestQuotation(po.id)}
                            disabled={sending === po.id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                          >
                            {sending === po.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Requesting...
                              </>
                            ) : (
                              'Request Quotation'
                            )}
                          </button>
                        )}

                        {po.status === 'QUOTATION_SUBMITTED' && (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <button
                              onClick={() => handleApproveQuotation(po.id)}
                              disabled={confirming === po.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                              {confirming === po.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Approving...
                                </>
                              ) : (
                                'Approve'
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectQuotation(po.id)}
                              disabled={confirming === po.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                              {confirming === po.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Rejecting...
                                </>
                              ) : (
                                'Reject'
                              )}
                            </button>
                            <button
                              onClick={() => openRevisionModal(po)}
                              disabled={revisionSubmitting && revisionModalPo?.id === po.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                            >
                              {revisionSubmitting && revisionModalPo?.id === po.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700 mr-1"></div>
                                  Sending...
                                </>
                              ) : (
                                'Request Revision'
                              )}
                            </button>
                          </div>
                        )}

                        {po.status === 'QUOTATION_REVISION_REQUESTED' && (
                          <span className="text-xs text-amber-600 font-medium text-right">
                            Waiting for supplier revisions
                          </span>
                        )}

                        {po.status === 'QUOTATION_APPROVED' && (
                          <span className="text-xs text-green-600 font-medium">
                            Quotation approved - waiting for supplier to ship
                          </span>
                        )}

                        {po.status === 'SHIPPED' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setConfirmAction('received')
                                setConfirming(po.id)
                              }}
                              disabled={confirming === po.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                              {confirming === po.id && confirmAction === 'received' ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Confirming...
                                </>
                              ) : (
                                'Mark as Received'
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setConfirmAction('rejected')
                                setConfirming(po.id)
                              }}
                              disabled={confirming === po.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                              {confirming === po.id && confirmAction === 'rejected' ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Rejecting...
                                </>
                              ) : (
                                'Reject'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left font-semibold text-gray-600">Product</th>
                                <th className="px-4 py-2 text-center font-semibold text-gray-600">Qty</th>
                                <th className="px-4 py-2 text-right font-semibold text-gray-600">Store Estimate</th>
                                <th className="px-4 py-2 text-right font-semibold text-gray-600">Supplier Quote</th>
                                <th className="px-4 py-2 text-right font-semibold text-gray-600">Line Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {po.items.map((item) => {
                                const quoted = item.quotedCostPaise ?? null
                                const lineTotal = (quoted ?? item.costPaise) * item.qty

                                return (
                                  <tr key={item.id} className="bg-white">
                                    <td className="px-4 py-2">
                                      <div className="text-gray-900 font-medium">{item.product.title}</div>
                                      {item.product.sku && (
                                        <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-center font-semibold text-gray-700">{item.qty}</td>
                                    <td className="px-4 py-2 text-right text-gray-700">{formatCurrency(item.costPaise)}</td>
                                    <td className="px-4 py-2 text-right text-gray-900 font-semibold">
                                      {quoted !== null ? formatCurrency(quoted) : 'Awaiting quote'}
                                    </td>
                                    <td className="px-4 py-2 text-right text-gray-900 font-semibold">
                                      {formatCurrency(lineTotal)}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="text-sm text-gray-500">Subtotal</div>
                            <div className="text-lg font-semibold text-gray-900">{formatCurrency(po.subtotal)}</div>
                          </div>
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="text-sm text-gray-500">Tax (GST)</div>
                            <div className="text-lg font-semibold text-gray-900">{formatCurrency(po.taxTotal)}</div>
                          </div>
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="text-sm text-gray-500">Grand Total</div>
                            <div className="text-xl font-bold text-gray-900">{formatCurrency(po.total)}</div>
                          </div>
                        </div>

                        {po.quotationNotes && (
                          <div className="mt-4 flex items-start space-x-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            <InformationCircleIcon className="h-5 w-5 text-amber-500" />
                            <div>
                              <div className="font-semibold">Latest revision note</div>
                              <p className="mt-1">{po.quotationNotes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
        {purchaseOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No purchase orders found. Create your first purchase order to get started.</div>
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

      {/* Confirmation Modal */}
      {confirming && confirmAction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {confirmAction === 'received' ? 'Confirm Received' : 'Reject Order'}
                </h3>
                <button
                  onClick={() => {
                    setConfirming(null)
                    setConfirmAction(null)
                    setConfirmNotes('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {confirmAction === 'received' 
                    ? 'Are you sure you want to mark this order as received? This will update stock levels.'
                    : 'Are you sure you want to reject this order? This action cannot be undone.'
                  }
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={confirmNotes}
                    onChange={(e) => setConfirmNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add any notes about this action..."
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setConfirming(null)
                    setConfirmAction(null)
                    setConfirmNotes('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmOrder(confirming, confirmAction)}
                  disabled={confirming === null}
                  className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    confirmAction === 'received' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {confirmAction === 'received' ? 'Confirm Received' : 'Reject Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {revisionModalPo && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto w-full max-w-lg px-4">
            <div className="rounded-lg bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Request Quotation Revision</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Let {revisionModalPo.supplier.name} know what needs to be updated before approval.
                  </p>
                </div>
                <button
                  onClick={closeRevisionModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Revision notes
                </label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain what needs to be updated in this quotation..."
                />
                <p className="mt-2 text-xs text-gray-500">
                  These notes will be visible to the supplier along with the purchase order.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  onClick={closeRevisionModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRevisionRequest}
                  disabled={revisionSubmitting}
                  className="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {revisionSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Revision Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
