'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import Pagination from '@/components/Pagination'
import { EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

interface OrderItem {
  id: number
  qty: number
  priceSnap: number
  product: {
    id: number
    title: string
    sku: string | null
  }
}

interface Order {
  id: number
  buyerName: string
  phone: string
  email: string | null
  address: string
  addressId: number | null
  customerAddress: {
    id: number
    title: string
    fullName: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  } | null
  status: string
  subtotal: number
  discountAmount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  totalAmount: number
  createdAt: string
  items: OrderItem[]
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [discountModal, setDiscountModal] = useState<{
    isOpen: boolean
    orderId: number | null
    currentDiscount: number
    currentType: 'AMOUNT' | 'PERCENTAGE'
  }>({
    isOpen: false,
    orderId: null,
    currentDiscount: 0,
    currentType: 'AMOUNT'
  })
  const [updatingDiscount, setUpdatingDiscount] = useState(false)
  const [confirmingOrder, setConfirmingOrder] = useState<number | null>(null)
  const [rejectingOrder, setRejectingOrder] = useState<number | null>(null)
  const [markingShipped, setMarkingShipped] = useState<number | null>(null)
  const [markingDelivered, setMarkingDelivered] = useState<number | null>(null)

  // Redirect if not authenticated or not store owner
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    if (session.user.role !== 'STORE_OWNER') {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  const fetchOrders = useCallback(async (page?: number) => {
    try {
      setLoading(true)
      const pageToFetch = page || currentPage
      
      // First get the store ID
      const storeResponse = await fetch('/api/stores')
      if (!storeResponse.ok) throw new Error('Failed to fetch store')
      const storeData = await storeResponse.json()
      const stores = storeData.stores || storeData
      if (!stores || stores.length === 0) throw new Error('No store found')
      
      const response = await fetch(`/api/orders?storeId=${stores[0].id}&page=${pageToFetch}&limit=10`)
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const data: OrdersResponse = await response.json()
      
      // Ensure all items have valid product data
      const safeOrders = (data.orders || data).map((order: any) => ({
        ...order,
        items: order.items?.map((item: any) => ({
          ...item,
          product: item.product || { title: 'Unknown Product', sku: null }
        })) || []
      }))
      
      setOrders(safeOrders)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    if (session?.user?.role === 'STORE_OWNER') {
      fetchOrders()
    }
  }, [session, fetchOrders])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchOrders(page)
  }

  const openDiscountModal = (order: Order) => {
    setDiscountModal({
      isOpen: true,
      orderId: order.id,
      currentDiscount: order.discountAmount,
      currentType: order.discountType
    })
  }

  const closeDiscountModal = () => {
    setDiscountModal({
      isOpen: false,
      orderId: null,
      currentDiscount: 0,
      currentType: 'AMOUNT'
    })
  }

  const updateDiscount = async () => {
    if (!discountModal.orderId) return

    try {
      setUpdatingDiscount(true)
      const response = await fetch(`/api/orders/${discountModal.orderId}/discount`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discountAmount: discountModal.currentDiscount,
          discountType: discountModal.currentType
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === discountModal.orderId 
              ? { ...order, ...data.order, customerAddress: order.customerAddress }
              : order
          )
        )
        closeDiscountModal()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update discount')
      }
    } catch (error) {
      console.error('Error updating discount:', error)
      setError('Failed to update discount')
    } finally {
      setUpdatingDiscount(false)
    }
  }

  const removeDiscount = async (orderId: number) => {
    try {
      setUpdatingDiscount(true)
      const response = await fetch(`/api/orders/${orderId}/discount`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, ...data.order, customerAddress: order.customerAddress }
              : order
          )
        )
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to remove discount')
      }
    } catch (error) {
      console.error('Error removing discount:', error)
      setError('Failed to remove discount')
    } finally {
      setUpdatingDiscount(false)
    }
  }

  const confirmOrder = async (orderId: number) => {
    try {
      setConfirmingOrder(orderId)
      setError(null)

      const response = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, ...data.order, customerAddress: order.customerAddress }
              : order
          )
        )
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to confirm order')
      }
    } catch (error) {
      console.error('Error confirming order:', error)
      setError('Failed to confirm order')
    } finally {
      setConfirmingOrder(null)
    }
  }

  const rejectOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to reject this order? Stock will be restored.')) {
      return
    }

    try {
      setRejectingOrder(orderId)
      setError(null)

      const response = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, ...data.order, customerAddress: order.customerAddress }
              : order
          )
        )
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to reject order')
      }
    } catch (error) {
      console.error('Error rejecting order:', error)
      setError('Failed to reject order')
    } finally {
      setRejectingOrder(null)
    }
  }

  const markAsShipped = async (orderId: number) => {
    if (!confirm('Are you sure you want to mark this order as shipped?')) {
      return
    }

    try {
      setMarkingShipped(orderId)
      setError(null)

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'SHIPPED'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, ...data, customerAddress: order.customerAddress }
              : order
          )
        )
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to mark order as shipped')
      }
    } catch (error) {
      console.error('Error marking order as shipped:', error)
      setError('Failed to mark order as shipped')
    } finally {
      setMarkingShipped(null)
    }
  }

  const markAsDelivered = async (orderId: number) => {
    if (!confirm('Are you sure you want to mark this order as delivered?')) {
      return
    }

    try {
      setMarkingDelivered(orderId)
      setError(null)

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DELIVERED'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, ...data, customerAddress: order.customerAddress }
              : order
          )
        )
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to mark order as delivered')
      }
    } catch (error) {
      console.error('Error marking order as delivered:', error)
      setError('Failed to mark order as delivered')
    } finally {
      setMarkingDelivered(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading orders...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-800">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage customer orders and track their status
          </p>
        </div>
      </div>

      <div className="mt-8">
        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Order #{order.id.toString().slice(-8)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Customer: </span>
                  <span className="font-medium text-gray-900">
                    {order.customerAddress ? order.customerAddress.fullName : order.buyerName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Phone: </span>
                  <span className="text-gray-900">
                    {order.customerAddress ? order.customerAddress.phone : order.phone}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Items: </span>
                  <span className="text-gray-900">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Total: </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                <Link
                  href={`/seller/orders/${order.id}`}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                >
                  <EyeIcon className="h-3 w-3 mr-1" />
                  View
                </Link>
                <Link
                  href={`/seller/billing/receipt/${order.id}?from=orders`}
                  target="_blank"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                >
                  <DocumentTextIcon className="h-3 w-3 mr-1" />
                  Receipt
                </Link>
                {order.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => confirmOrder(order.id)}
                      className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                      disabled={confirmingOrder === order.id}
                    >
                      {confirmingOrder === order.id ? 'Confirming...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => rejectOrder(order.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                      disabled={rejectingOrder === order.id}
                    >
                      {rejectingOrder === order.id ? 'Rejecting...' : 'Reject'}
                    </button>
                  </>
                )}
                {order.status === 'CONFIRMED' && (
                  <>
                    <button
                      onClick={() => openDiscountModal(order)}
                      className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                      disabled={updatingDiscount}
                    >
                      {order.discountAmount > 0 ? 'Edit Discount' : 'Add Discount'}
                    </button>
                    <button
                      onClick={() => markAsShipped(order.id)}
                      className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100"
                      disabled={markingShipped === order.id}
                    >
                      {markingShipped === order.id ? 'Marking...' : 'Ship'}
                    </button>
                  </>
                )}
                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => markAsDelivered(order.id)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                    disabled={markingDelivered === order.id}
                  >
                    {markingDelivered === order.id ? 'Marking...' : 'Deliver'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block flow-root">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Order ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Items
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Total
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        #{order.id.toString().slice(-8)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {order.customerAddress ? order.customerAddress.fullName : order.buyerName}
                          </div>
                          <div className="text-gray-500">
                            {order.customerAddress ? order.customerAddress.phone : order.phone}
                          </div>
                          {order.customerAddress && order.customerAddress.title && (
                            <div className="text-xs text-blue-600 mt-1">
                              {order.customerAddress.title} Address
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="max-w-xs">
                          {order.items.map((item, index) => (
                            <div key={item.id} className="truncate">
                              {item.product?.title || 'Unknown Product'} × {item.qty ?? 0}
                              {index < order.items.length - 1 && ', '}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                          {order.discountAmount > 0 && (
                            <div className="text-xs text-gray-500">
                              <span className="line-through">{formatCurrency(order.subtotal)}</span>
                              <span className="ml-2 text-green-600">
                                -{formatCurrency(order.discountAmount)} 
                                {order.discountType === 'PERCENTAGE' ? ` (${order.discountAmount}%)` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Order Confirmation Buttons */}
                          {order.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => confirmOrder(order.id)}
                                className="text-green-600 hover:text-green-900 font-medium"
                                disabled={confirmingOrder === order.id}
                              >
                                {confirmingOrder === order.id ? 'Confirming...' : 'Confirm'}
                              </button>
                              <button 
                                onClick={() => rejectOrder(order.id)}
                                className="text-red-600 hover:text-red-900 font-medium"
                                disabled={rejectingOrder === order.id}
                              >
                                {rejectingOrder === order.id ? 'Rejecting...' : 'Reject'}
                              </button>
                            </>
                          )}
                          
                          {/* Discount Buttons */}
                          {order.status === 'CONFIRMED' && (
                            <>
                              <button 
                                onClick={() => openDiscountModal(order)}
                                className="text-green-600 hover:text-green-900"
                                disabled={updatingDiscount}
                              >
                                {order.discountAmount > 0 ? 'Edit Discount' : 'Add Discount'}
                              </button>
                              {order.discountAmount > 0 && (
                                <button 
                                  onClick={() => removeDiscount(order.id)}
                                  className="text-red-600 hover:text-red-900"
                                  disabled={updatingDiscount}
                                >
                                  Remove
                                </button>
                              )}
                              <button 
                                onClick={() => markAsShipped(order.id)}
                                className="text-purple-600 hover:text-purple-900 font-medium"
                                disabled={markingShipped === order.id}
                              >
                                {markingShipped === order.id ? 'Marking...' : 'Mark as Shipped'}
                              </button>
                            </>
                          )}

                          {/* Shipped Orders */}
                          {order.status === 'SHIPPED' && (
                            <button 
                              onClick={() => markAsDelivered(order.id)}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                              disabled={markingDelivered === order.id}
                            >
                              {markingDelivered === order.id ? 'Marking...' : 'Mark as Delivered'}
                            </button>
                          )}
                          
                          <Link 
                            href={`/seller/orders/${order.id}`}
                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View Details
                          </Link>
                          <Link 
                            href={`/seller/billing/receipt/${order.id}?from=orders`}
                            target="_blank"
                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:text-green-700 transition-colors"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            View Receipt
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
          <p className="mt-1 text-sm text-gray-500">Orders will appear here when customers place them.</p>
        </div>
      )}

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

      {/* Discount Modal */}
      {discountModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {discountModal.currentDiscount > 0 ? 'Edit Discount' : 'Add Discount'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Type
                  </label>
                  <select
                    value={discountModal.currentType}
                    onChange={(e) => setDiscountModal(prev => ({
                      ...prev,
                      currentType: e.target.value as 'AMOUNT' | 'PERCENTAGE'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AMOUNT">Fixed Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount {discountModal.currentType === 'PERCENTAGE' ? 'Percentage' : 'Amount'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountModal.currentType === 'PERCENTAGE' ? 100 : undefined}
                    value={discountModal.currentDiscount}
                    onChange={(e) => setDiscountModal(prev => ({
                      ...prev,
                      currentDiscount: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={discountModal.currentType === 'PERCENTAGE' ? 'Enter percentage' : 'Enter amount in paise'}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeDiscountModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    disabled={updatingDiscount}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateDiscount}
                    disabled={updatingDiscount}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  >
                    {updatingDiscount ? 'Updating...' : 'Apply Discount'}
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

