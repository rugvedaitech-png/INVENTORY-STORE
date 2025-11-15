'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  DocumentTextIcon, 
  BuildingOfficeIcon, 
  CurrencyRupeeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  TruckIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import SupplierLayoutClient from '../SupplierLayoutClient'
import Pagination from '@/components/Pagination'

interface QuotationRequest {
  id: number
  code: string
  status: string
  notes: string | null
  quotationNotes: string | null
  subtotal: number
  taxTotal: number
  total: number
  quotationRequestedAt: string
  createdAt: string
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

interface QuotationRequestsResponse {
  quotationRequests: QuotationRequest[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function QuotationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [quotationData, setQuotationData] = useState<{[key: number]: {[key: number]: number}}>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const userEmail = session?.user?.email ?? ''
  const userName = session?.user?.name ?? session?.user?.email ?? 'Supplier'

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    if (session.user.role !== 'SUPPLIER') {
      router.push('/unauthorized')
      return
    }
    
    fetchQuotationRequests()
  }, [session, status, router])

  const fetchQuotationRequests = useCallback(async (page?: number) => {
    try {
      setLoading(true)
      const pageToFetch = page || currentPage
      const response = await fetch(`/api/supplier/quotation-requests?page=${pageToFetch}&limit=10`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotation requests')
      }
      
      const data: QuotationRequestsResponse = await response.json()
      setQuotationRequests(data.quotationRequests || [])
      setPagination(data.pagination)
      
      // Initialize quotation data with existing quoted costs
      const initialQuotationData: {[key: number]: {[key: number]: number}} = {}
      data.quotationRequests?.forEach((request: QuotationRequest) => {
        initialQuotationData[request.id] = {}
        request.items.forEach((item) => {
          if (item.quotedCostPaise) {
            initialQuotationData[request.id][item.id] = item.quotedCostPaise / 100
          }
        })
      })
      setQuotationData(initialQuotationData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotation requests')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchQuotationRequests(page)
  }

  const isEditableStatus = (status: string) => (
    status === 'QUOTATION_REQUESTED' || status === 'QUOTATION_REVISION_REQUESTED'
  )

  const handleQuotationChange = (poId: number, itemId: number, value: string) => {
    const numericValue = parseFloat(value) || 0
    setQuotationData(prev => ({
      ...prev,
      [poId]: {
        ...prev[poId],
        [itemId]: numericValue
      }
    }))
  }

  const handleSubmitQuotation = async (poId: number) => {
    try {
      setSubmitting(poId)
      setError(null)
      
      const quotation = quotationData[poId] || {}
      const response = await fetch(`/api/supplier/quotation-requests/${poId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit quotation')
      }

      await fetchQuotationRequests()
      setSubmitting(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quotation')
    } finally {
      setSubmitting(null)
    }
  }

  const handleShipOrder = async (poId: number) => {
    try {
      setSubmitting(poId)
      setError(null)
      
      const response = await fetch(`/api/purchase-orders/${poId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Order shipped after quotation approval' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to ship order')
      }

      await fetchQuotationRequests()
      setSubmitting(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ship order')
    } finally {
      setSubmitting(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUOTATION_REQUESTED': return 'bg-yellow-100 text-yellow-800'
      case 'QUOTATION_SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'QUOTATION_REVISION_REQUESTED': return 'bg-amber-100 text-amber-800'
      case 'QUOTATION_APPROVED': return 'bg-green-100 text-green-800'
      case 'QUOTATION_REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'QUOTATION_REQUESTED': return <ClockIcon className="h-4 w-4" />
      case 'QUOTATION_SUBMITTED': return <DocumentTextIcon className="h-4 w-4" />
      case 'QUOTATION_REVISION_REQUESTED': return <ArrowPathIcon className="h-4 w-4" />
      case 'QUOTATION_APPROVED': return <CheckIcon className="h-4 w-4" />
      case 'QUOTATION_REJECTED': return <XMarkIcon className="h-4 w-4" />
      default: return <DocumentTextIcon className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <SupplierLayoutClient userEmail={userEmail} userName={userName}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </SupplierLayoutClient>
    )
  }

  return (
    <SupplierLayoutClient userEmail={userEmail} userName={userName}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-8 w-8 mr-3 text-indigo-600" />
                    Quotation Requests
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Review and submit quotations for purchase order requests
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Quotation Requests List */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Quotation Requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {quotationRequests.length} request{quotationRequests.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              {quotationRequests.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No quotation requests</h3>
                  <p className="mt-1 text-sm text-gray-500">You don't have any pending quotation requests.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {quotationRequests.map((request) => {
                    const editable = isEditableStatus(request.status)

                    return (
                    <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                              <DocumentTextIcon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-semibold text-gray-900">{request.code}</h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span className="ml-1.5">{request.status.replace('_', ' ')}</span>
                              </span>
                            </div>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                                {request.supplier.name}
                              </span>
                              <span>•</span>
                              <span>{request.items.length} item{request.items.length !== 1 ? 's' : ''}</span>
                              <span>•</span>
                              <span>Requested: {new Date(request.quotationRequestedAt).toLocaleDateString()}</span>
                            </div>
                            {request.notes && (
                              <div className="mt-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                                <span className="font-medium">Notes:</span> {request.notes}
                              </div>
                            )}
                            {request.status === 'QUOTATION_REVISION_REQUESTED' && (
                              <div className="mt-3 flex items-start space-x-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                                <InformationCircleIcon className="h-5 w-5 text-amber-500" />
                                <div>
                                  <p className="font-semibold">Revision requested by store owner</p>
                                  <p className="mt-1">
                                    {request.quotationNotes || 'Update the quotation and submit again to proceed.'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-3">
                          {isEditableStatus(request.status) && (
                            <button
                              onClick={() => handleSubmitQuotation(request.id)}
                              disabled={submitting === request.id}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                              {submitting === request.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                                  {request.status === 'QUOTATION_REVISION_REQUESTED' ? 'Resubmit Quotation' : 'Submit Quotation'}
                                </>
                              )}
                            </button>
                          )}
                          
                          {request.status === 'QUOTATION_APPROVED' && (
                            <button
                              onClick={() => handleShipOrder(request.id)}
                              disabled={submitting === request.id}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                              {submitting === request.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Shipping...
                                </>
                              ) : (
                                <>
                                  <TruckIcon className="h-4 w-4 mr-2" />
                                  Mark as Shipped
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Items Section */}
                      <div className="mt-6">
                        <h5 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                          <CurrencyRupeeIcon className="h-4 w-4 mr-2 text-gray-500" />
                          Items to Quote
                        </h5>
                        <div className="grid gap-4">
                          {request.items.map((item) => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <CurrencyRupeeIcon className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <div>
                                    <h6 className="text-sm font-medium text-gray-900">
                                      {item.product.title}
                                    </h6>
                                    <p className="text-xs text-gray-500">
                                      {item.product.sku && `SKU: ${item.product.sku}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      Qty: {item.qty}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      Store Estimate: ₹{(item.costPaise / 100).toFixed(2)}
                                    </div>
                                    {item.quotedCostPaise != null && (
                                      <div className="text-sm text-green-600 font-semibold">
                                        Quoted: ₹{(item.quotedCostPaise / 100).toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Price Input */}
                                  <div className="flex items-center space-x-2">
                                    <div className="relative">
                                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <CurrencyRupeeIcon className="h-4 w-4 text-gray-400" />
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={quotationData[request.id]?.[item.id] || (item.quotedCostPaise ? (item.quotedCostPaise / 100).toFixed(2) : '')}
                                        onChange={(e) => handleQuotationChange(request.id, item.id, e.target.value)}
                                        className={`w-32 pl-10 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                          !editable
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                                            : 'bg-white border-gray-300'
                                        }`}
                                        disabled={!editable}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        </div>
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
    </SupplierLayoutClient>
  )
}
