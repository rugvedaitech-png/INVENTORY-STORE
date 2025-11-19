'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import Pagination from '@/components/Pagination'

interface Order {
  id: number
  status: string
  totalAmount: number
  createdAt: string
  updatedAt: string
  items: Array<{
    id: number
    quantity: number
    product: {
      id: number
      title: string
      price: number
      images: string
    }
  }>
  store: {
    id: number
    name: string
    whatsapp: string | null
  }
  user: {
    id: number
    name: string
    email: string
  }
}

function OrderTrackingPageContent() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingCode, setTrackingCode] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Fetch a specific order by ID if not found in current page
  const fetchSpecificOrder = async (orderId: number) => {
    try {
      // Fetch all orders with a high limit to find the specific order
      const response = await fetch(`/api/customer/orders?limit=100`)
      if (response.ok) {
        const data = await response.json()
        const allOrders = data.orders || []
        const targetOrder = allOrders.find((o: Order) => o.id === orderId)
        if (targetOrder) {
          setSelectedOrder(targetOrder)
          // Also add it to the orders list if not already there
          setOrders((prevOrders) => {
            if (!prevOrders.find((o) => o.id === orderId)) {
              return [targetOrder, ...prevOrders]
            }
            return prevOrders
          })
        }
      }
    } catch (error) {
      console.error('Error fetching specific order:', error)
    }
  }

  useEffect(() => {
    fetchOrders(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const fetchOrders = async (page: number = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customer/orders?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        const fetchedOrders = data.orders || []
        setOrders(fetchedOrders)
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        })
        
        // Check if there's an orderId in the URL query params
        const orderIdParam = searchParams?.get('orderId')
        const targetOrderId = orderIdParam ? parseInt(orderIdParam) : null
        
        // If selected order is not in current page, select first order or clear selection
        if (fetchedOrders.length > 0) {
          // If there's an orderId in URL, try to find and select it
          if (targetOrderId) {
            const targetOrder = fetchedOrders.find((o: Order) => o.id === targetOrderId)
            if (targetOrder) {
              setSelectedOrder(targetOrder)
            } else {
              // If order not in current page, fetch it directly
              fetchSpecificOrder(targetOrderId)
              // Select first order as fallback
              setSelectedOrder(fetchedOrders[0])
            }
          } else {
            // No orderId in URL, use normal selection logic
            setSelectedOrder((prevSelected) => {
              // Check if previously selected order is in the new page
              if (prevSelected && fetchedOrders.find((o: Order) => o.id === prevSelected.id)) {
                return prevSelected
              }
              // Otherwise, select the first order
              return fetchedOrders[0]
            })
          }
        } else {
          setSelectedOrder(null)
        }
      } else {
        console.error('Failed to fetch orders:', response.status, response.statusText)
        setOrders([])
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
      setSelectedOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100'
      case 'CONFIRMED':
        return 'text-blue-600 bg-blue-100'
      case 'PROCESSING':
        return 'text-purple-600 bg-purple-100'
      case 'SHIPPED':
        return 'text-indigo-600 bg-indigo-100'
      case 'DELIVERED':
        return 'text-green-600 bg-green-100'
      case 'CANCELLED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return ClockIcon
      case 'CONFIRMED':
        return CheckCircleIcon
      case 'PROCESSING':
        return ClockIcon
      case 'SHIPPED':
        return TruckIcon
      case 'DELIVERED':
        return CheckCircleIcon
      case 'CANCELLED':
        return ExclamationTriangleIcon
      default:
        return ClockIcon
    }
  }

  const getStatusSteps = (status: string) => {
    const steps = [
      { name: 'Order Placed', status: 'completed' },
      { name: 'Confirmed', status: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status) ? 'completed' : 'pending' },
      { name: 'Processing', status: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status) ? 'completed' : 'pending' },
      { name: 'Shipped', status: ['SHIPPED', 'DELIVERED'].includes(status) ? 'completed' : 'pending' },
      { name: 'Delivered', status: status === 'DELIVERED' ? 'completed' : 'pending' }
    ]
    return steps
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <TruckIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
                  <p className="text-gray-600">Track your orders and delivery status</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter tracking code..."
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <TruckIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Orders Found</h2>
              <p className="text-gray-600 mb-8">You haven't placed any orders yet.</p>
              <a
                href="/customer/shop"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Start Shopping
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Orders List */}
              <div className="lg:col-span-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Orders</h2>
                <div className="space-y-4 mb-6">
                  {orders.map((order) => {
                    const StatusIcon = getStatusIcon(order.status)
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedOrder?.id === order.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <StatusIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-900">
                            ₹{(order.totalAmount / 100).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.pages}
                      totalItems={pagination.total}
                      itemsPerPage={pagination.limit}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>

              {/* Order Details */}
              <div className="lg:col-span-2">
                {selectedOrder ? (
                  <div className="bg-white rounded-xl shadow-sm border">
                    {/* Order Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Order #{selectedOrder.id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Order Date:</span>
                          <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Amount:</span>
                          <p className="font-medium">₹{(selectedOrder.totalAmount / 100).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tracking Steps */}
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Tracking Progress</h4>
                      <div className="space-y-4">
                        {getStatusSteps(selectedOrder.status).map((step, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.status === 'completed' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-400'
                            }`}>
                              {step.status === 'completed' ? (
                                <CheckCircleIcon className="w-5 h-5" />
                              ) : (
                                <span className="text-sm font-medium">{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <p className={`font-medium ${
                                step.status === 'completed' ? 'text-gray-900' : 'text-gray-500'
                              }`}>
                                {step.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{item.product.title}</h5>
                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                ₹{((item.product.price * item.quantity) / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Store Contact */}
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Store Contact</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {selectedOrder.store.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{selectedOrder.store.name}</h5>
                          </div>
                        </div>
                        {selectedOrder.store.whatsapp && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <PhoneIcon className="w-4 h-4" />
                            <span>{selectedOrder.store.whatsapp}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Order</h3>
                    <p className="text-gray-500">Choose an order from the list to view tracking details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OrderTrackingPageContent />
    </Suspense>
  )
}
