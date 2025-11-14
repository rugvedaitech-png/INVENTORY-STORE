'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  TruckIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline'
import SupplierLayoutClient from '../SupplierLayoutClient'
import Pagination from '@/components/Pagination'

interface PurchaseOrder {
  id: number
  code: string
  status: string
  total: number
  notes: string | null
  placedAt: string | null
  createdAt: string
  supplier?: {
    id: number
    name: string
    email: string | null
    phone: string | null
  }
  items: {
    id: number
    qty: number
    costPaise: number
    quotedCostPaise?: number | null
    product: {
      id: number
      title: string
      sku: string
    }
  }[]
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

export default function SupplierPurchaseOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shipping, setShipping] = useState<number | null>(null)
  const [shipNotes, setShipNotes] = useState('')
  const [showShipModal, setShowShipModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

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
    fetchPurchaseOrders()
  }, [session, status, router])

  const fetchPurchaseOrders = useCallback(async (page?: number) => {
    try {
      setLoading(true)
      const pageToFetch = page || currentPage
      const response = await fetch(`/api/supplier/purchase-orders?page=${pageToFetch}&limit=10`)
      if (!response.ok) throw new Error('Failed to fetch purchase orders')
      
      const data: PurchaseOrdersResponse = await response.json()
      setPurchaseOrders(data.purchaseOrders || [])
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchase orders')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchPurchaseOrders(page)
  }

  const handleShipOrder = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setShowShipModal(true)
  }

  const confirmShipOrder = async () => {
    if (!selectedPO) return

    try {
      setShipping(selectedPO.id)
      setError(null)
      
      const response = await fetch(`/api/purchase-orders/${selectedPO.id}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: shipNotes })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to ship order')
      }

      await fetchPurchaseOrders()
      setShipNotes('')
      setShipping(null)
      setShowShipModal(false)
      setSelectedPO(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ship order')
    } finally {
      setShipping(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'QUOTATION_REQUESTED': return 'bg-yellow-100 text-yellow-800'
      case 'QUOTATION_SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'QUOTATION_APPROVED': return 'bg-green-100 text-green-800'
      case 'QUOTATION_REJECTED': return 'bg-red-100 text-red-800'
      case 'SENT': return 'bg-indigo-100 text-indigo-800'
      case 'SHIPPED': return 'bg-yellow-100 text-yellow-800'
      case 'RECEIVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'CLOSED': return 'bg-purple-100 text-purple-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSupplierStatusDisplay = (status: string) => {
    switch (status) {
      case 'QUOTATION_REQUESTED': return 'QUOTATION REQUESTED'
      case 'QUOTATION_SUBMITTED': return 'QUOTATION SUBMITTED'
      case 'QUOTATION_APPROVED': return 'QUOTATION APPROVED'
      case 'QUOTATION_REJECTED': return 'QUOTATION REJECTED'
      case 'RECEIVED': return 'DELIVERED'
      case 'REJECTED': return 'REJECTED'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'QUOTATION_REQUESTED': return <ClockIcon className="h-4 w-4" />
      case 'QUOTATION_SUBMITTED': return <DocumentTextIcon className="h-4 w-4" />
      case 'QUOTATION_APPROVED': return <CheckCircleIcon className="h-4 w-4" />
      case 'QUOTATION_REJECTED': return <XCircleIcon className="h-4 w-4" />
      case 'SENT': return <ClockIcon className="h-4 w-4" />
      case 'SHIPPED': return <TruckIcon className="h-4 w-4" />
      case 'RECEIVED': return <CheckCircleIcon className="h-4 w-4" />
      case 'REJECTED': return <XCircleIcon className="h-4 w-4" />
      default: return <DocumentTextIcon className="h-4 w-4" />
    }
  }

  if (status === 'loading' || loading) {
    return (
      <SupplierLayoutClient
        userEmail={session?.user?.email || 'supplier@example.com'}
        userName={session?.user?.name || 'Supplier User'}
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading purchase orders...</p>
          </div>
        </div>
      </SupplierLayoutClient>
    )
  }

  return (
    <SupplierLayoutClient
      userEmail={session?.user?.email || 'supplier@example.com'}
      userName={session?.user?.name || 'Supplier User'}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-8 w-8 mr-3 text-indigo-600" />
                    My Purchase Orders
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Manage and track your purchase orders
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

            {/* Purchase Orders List */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Purchase Orders</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {purchaseOrders.length} order{purchaseOrders.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              {purchaseOrders.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No purchase orders</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any purchase orders yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {purchaseOrders.map((po) => (
                    <div key={po.id} className="p-6 hover:bg-gray-50 transition-colors">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                              <DocumentTextIcon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-semibold text-gray-900">{po.code}</h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                                {getStatusIcon(po.status)}
                                <span className="ml-1.5">{getSupplierStatusDisplay(po.status)}</span>
                              </span>
                            </div>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                                {po.supplier?.name || 'Store'}
                              </span>
                              <span>•</span>
                              <span>{po.items.length} item{po.items.length !== 1 ? 's' : ''}</span>
                              <span>•</span>
                              <span className="font-semibold text-gray-900">₹{((po.total || 0) / 100).toFixed(2)}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                              Created: {new Date(po.createdAt).toLocaleDateString()}
                              {po.placedAt && (
                                <span> • Placed: {new Date(po.placedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-3">
                          {(po.status === 'SENT' || po.status === 'QUOTATION_APPROVED') && (
                            <button
                              onClick={() => handleShipOrder(po)}
                              disabled={shipping === po.id}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                              {shipping === po.id ? (
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
                          
                          {po.status === 'DRAFT' && (
                            <span className="text-sm text-gray-500 italic">
                              Waiting for store to send order
                            </span>
                          )}
                          
                          {po.status === 'QUOTATION_REQUESTED' && (
                            <span className="text-sm text-yellow-600 font-medium">
                              Quotation requested - please provide pricing
                            </span>
                          )}
                          
                          {po.status === 'QUOTATION_SUBMITTED' && (
                            <span className="text-sm text-blue-600 font-medium">
                              Quotation submitted - waiting for store approval
                            </span>
                          )}
                          
                          {po.status === 'QUOTATION_REJECTED' && (
                            <span className="text-sm text-red-600 font-medium">
                              Quotation rejected by store
                            </span>
                          )}
                          
                          {po.status === 'SHIPPED' && (
                            <span className="text-sm text-blue-600 font-medium">
                              Order shipped - waiting for store confirmation
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Items Section */}
                      <div className="mt-6">
                        <h5 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                          <CurrencyRupeeIcon className="h-4 w-4 mr-2 text-gray-500" />
                          Order Items
                        </h5>
                        <div className="grid gap-3">
                          {po.items.map((item) => (
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
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    Qty: {item.qty}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    ₹{((item.quotedCostPaise || item.costPaise || 0) / 100).toFixed(2)} each
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
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

      {/* Shipping Confirmation Modal */}
      {showShipModal && selectedPO && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Mark Order as Shipped
                </h3>
                <button
                  onClick={() => {
                    setShowShipModal(false)
                    setSelectedPO(null)
                    setShipNotes('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Order: <span className="font-medium">{selectedPO.code}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: <span className="font-medium">₹{((selectedPO.total || 0) / 100).toFixed(2)}</span>
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Notes (Optional)
                  </label>
                  <textarea
                    value={shipNotes}
                    onChange={(e) => setShipNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add any notes about the shipment (tracking number, delivery method, etc.)"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowShipModal(false)
                    setSelectedPO(null)
                    setShipNotes('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmShipOrder}
                  disabled={shipping === selectedPO.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {shipping === selectedPO.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Shipping...
                    </>
                  ) : (
                    'Confirm Shipment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupplierLayoutClient>
  )
}