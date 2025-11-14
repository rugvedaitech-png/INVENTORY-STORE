'use client'

import { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  ShoppingBagIcon,
  CalendarIcon,
  CreditCardIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface Order {
  id: number
  status: string
  totalAmount: number
  createdAt: string
  updatedAt: string
  trackingCode?: string
  estimatedDelivery?: string
  address?: string | null
  items: Array<{
    id: number
    quantity: number
    product: {
      id: number
      title: string
      price: number
      images: string
      description: string | null
    }
  }>
  store: {
    id: number
    name: string
    whatsapp: string | null
    upiId: string | null
  }
  user: {
    id: number
    name: string
    email: string
    phone?: string | null
  }
  customerAddress?: {
    address?: string | null
    phone?: string | null
  }
}

interface TrackingStep {
  name: string
  status: 'completed' | 'current' | 'pending'
  description: string
  timestamp?: string
  icon: React.ComponentType<{ className?: string }>
}

export default function OrderSummaryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState('all')
  const [trackingCode, setTrackingCode] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/customer/orders')
      if (response.ok) {
        const data = await response.json()
        // Add tracking codes and estimated delivery dates
        const ordersWithTracking = (data.orders || []).map((order: Order) => ({
          ...order,
          trackingCode: `TRK${order.id.toString().padStart(6, '0')}`,
          estimatedDelivery: calculateEstimatedDelivery(order.status, order.createdAt)
        }))
        setOrders(ordersWithTracking)
        if (ordersWithTracking.length > 0 && !selectedOrder) {
          setSelectedOrder(ordersWithTracking[0])
        }
      } else {
        console.error('Failed to fetch orders:', response.status, response.statusText)
        setOrders([])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshOrders = async () => {
    setRefreshing(true)
    await fetchOrders()
  }

  const calculateEstimatedDelivery = (status: string, createdAt: string) => {
    const orderDate = new Date(createdAt)
    const deliveryDays = {
      'PENDING': 5,
      'CONFIRMED': 4,
      'SHIPPED': 2,
      'DELIVERED': 0,
      'CANCELLED': 0,
      'REJECTED': 0
    }
    
    const days = deliveryDays[status as keyof typeof deliveryDays] || 3
    const deliveryDate = new Date(orderDate)
    deliveryDate.setDate(deliveryDate.getDate() + days)
    
    return deliveryDate.toISOString()
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
        return XCircleIcon
      case 'REJECTED':
        return ExclamationTriangleIcon
      default:
        return ClockIcon
    }
  }

  const getTrackingSteps = (order: Order): TrackingStep[] => {
    const steps: TrackingStep[] = [
      {
        name: 'Order Placed',
        status: 'completed',
        description: 'Your order has been successfully placed',
        timestamp: order.createdAt,
        icon: CheckCircleIcon
      },
      {
        name: 'Order Confirmed',
        status: ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'completed' : 
                order.status === 'PENDING' ? 'current' : 'pending',
        description: 'Store has confirmed your order',
        timestamp: ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status) ? order.updatedAt : undefined,
        icon: CheckCircleIcon
      },
      {
        name: 'Preparing for Shipment',
        status: ['SHIPPED', 'DELIVERED'].includes(order.status) ? 'completed' : 
                order.status === 'CONFIRMED' ? 'current' : 'pending',
        description: 'Your order is being prepared for shipment',
        timestamp: ['SHIPPED', 'DELIVERED'].includes(order.status) ? order.updatedAt : undefined,
        icon: ClockIcon
      },
      {
        name: 'Shipped',
        status: order.status === 'SHIPPED' ? 'current' : 
                order.status === 'DELIVERED' ? 'completed' : 'pending',
        description: 'Your order is on its way',
        timestamp: order.status === 'SHIPPED' ? order.updatedAt : undefined,
        icon: TruckIcon
      },
      {
        name: 'Delivered',
        status: order.status === 'DELIVERED' ? 'completed' : 'pending',
        description: 'Your order has been delivered',
        timestamp: order.status === 'DELIVERED' ? order.updatedAt : undefined,
        icon: CheckCircleIcon
      }
    ]

    // Handle cancelled/rejected orders
    if (['CANCELLED', 'REJECTED'].includes(order.status)) {
      steps[1] = {
        name: order.status === 'CANCELLED' ? 'Order Cancelled' : 'Order Rejected',
        status: 'completed',
        description: order.status === 'CANCELLED' ? 'Your order has been cancelled' : 'Your order has been rejected',
        timestamp: order.updatedAt,
        icon: order.status === 'CANCELLED' ? XCircleIcon : ExclamationTriangleIcon
      }
      return steps.slice(0, 2) // Only show first two steps for cancelled/rejected orders
    }

    return steps
  }

  const searchOrderByTrackingCode = () => {
    if (!trackingCode.trim()) return
    
    const foundOrder = orders.find(order => 
      order.trackingCode?.toLowerCase().includes(trackingCode.toLowerCase()) ||
      order.id.toString().includes(trackingCode)
    )
    
    if (foundOrder) {
      setSelectedOrder(foundOrder)
      setShowTrackingModal(false)
    } else {
      alert('Order not found. Please check your tracking code.')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status.toLowerCase() === filter.toLowerCase()
  })

  const calculateSubtotal = (order: Order) => {
    return order.items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const calculateTax = (subtotal: number) => {
    return Math.round(subtotal * 0.18) // 18% GST
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
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Order Summary & Tracking</h1>
                  <p className="text-gray-600">Detailed view of your orders with real-time tracking</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowTrackingModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  <span>Track Order</span>
                </button>
                <button
                  onClick={refreshOrders}
                  disabled={refreshing}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <DocumentTextIcon className="w-12 h-12 text-white" />
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Orders List */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Orders</h2>
                  <div className="space-y-2 mb-6">
                    {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filter === status
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)} ({orders.filter(o => filter === 'all' ? true : o.status.toLowerCase() === status).length})
                      </button>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    {filteredOrders.map((order) => {
                      const StatusIcon = getStatusIcon(order.status)
                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedOrder?.id === order.id
                              ? 'bg-blue-50 border-2 border-blue-200'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <StatusIcon className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-sm">Order #{order.id}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                          {order.trackingCode && (
                            <div className="text-xs text-blue-600 font-medium mb-1">
                              Tracking: {order.trackingCode}
                            </div>
                          )}
                          {order.estimatedDelivery && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'REJECTED' && (
                            <div className="text-xs text-green-600">
                              Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                            </div>
                          )}
                          <div className="text-sm font-semibold text-gray-900">
                            ₹{(order.totalAmount / 100).toFixed(2)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="lg:col-span-3">
                {selectedOrder ? (
                  <div className="bg-white rounded-xl shadow-sm border">
                    {/* Order Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">
                          Order Summary #{selectedOrder.id}
                        </h3>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-500">Order Date:</span>
                            <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-500">Last Updated:</span>
                            <p className="font-medium">{new Date(selectedOrder.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ShoppingBagIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-500">Items:</span>
                            <p className="font-medium">{selectedOrder.items.length}</p>
                          </div>
                        </div>
                        {selectedOrder.trackingCode && (
                          <div className="flex items-center space-x-2">
                            <TruckIcon className="w-4 h-4 text-gray-400" />
                            <div>
                              <span className="text-gray-500">Tracking Code:</span>
                              <p className="font-medium text-blue-600">{selectedOrder.trackingCode}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Tracking Timeline */}
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-6">Order Tracking</h4>
                      <div className="space-y-6">
                        {getTrackingSteps(selectedOrder).map((step, index) => {
                          const StepIcon = step.icon
                          return (
                            <div key={index} className="flex items-start space-x-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                step.status === 'completed' 
                                  ? 'bg-green-500 text-white' 
                                  : step.status === 'current'
                                  ? 'bg-blue-500 text-white animate-pulse'
                                  : 'bg-gray-200 text-gray-400'
                              }`}>
                                {step.status === 'completed' ? (
                                  <CheckCircleIcon className="w-5 h-5" />
                                ) : step.status === 'current' ? (
                                  <StepIcon className="w-5 h-5" />
                                ) : (
                                  <span className="text-sm font-medium">{index + 1}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h5 className={`font-semibold ${
                                    step.status === 'completed' || step.status === 'current' 
                                      ? 'text-gray-900' 
                                      : 'text-gray-500'
                                  }`}>
                                    {step.name}
                                  </h5>
                                  {step.timestamp && (
                                    <span className="text-sm text-gray-500">
                                      {new Date(step.timestamp).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm mt-1 ${
                                  step.status === 'completed' || step.status === 'current' 
                                    ? 'text-gray-600' 
                                    : 'text-gray-400'
                                }`}>
                                  {step.description}
                                </p>
                                {step.status === 'current' && (
                                  <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Estimated Delivery */}
                      {selectedOrder.estimatedDelivery && selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'REJECTED' && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <TruckIcon className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-900">Estimated Delivery</span>
                          </div>
                          <p className="text-blue-700 mt-1">
                            {new Date(selectedOrder.estimatedDelivery).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                      <div className="space-y-4">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{item.product.title}</h5>
                              {item.product.description && (
                                <p className="text-sm text-gray-500 mt-1">{item.product.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                <span className="text-sm text-gray-600">
                                  ₹{(item.product.price / 100).toFixed(2)} each
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                ₹{((item.product.price * item.quantity) / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">₹{(calculateSubtotal(selectedOrder) / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">GST (18%):</span>
                          <span className="font-medium">₹{(calculateTax(calculateSubtotal(selectedOrder)) / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="font-medium">Free</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span>₹{(selectedOrder.totalAmount / 100).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer & Store Info */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h4>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex items-center space-x-2">
                              <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{selectedOrder.user.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <PhoneIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">
                                {selectedOrder.user?.phone || selectedOrder.customerAddress?.phone || 'No phone provided'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPinIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">
                                {selectedOrder.customerAddress?.address || selectedOrder.address || 'No address provided'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Store Info */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h4>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="font-medium text-gray-900">{selectedOrder.store.name}</div>
                            {selectedOrder.store.whatsapp && (
                              <div className="flex items-center space-x-2">
                                <PhoneIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{selectedOrder.store.whatsapp}</span>
                              </div>
                            )}
                            {selectedOrder.store.upiId && (
                              <div className="flex items-center space-x-2">
                                <CreditCardIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">UPI: {selectedOrder.store.upiId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Order</h3>
                    <p className="text-gray-500">Choose an order from the list to view detailed summary</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tracking Modal */}
        {showTrackingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Track Your Order</h3>
                  <button
                    onClick={() => setShowTrackingModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Tracking Code or Order ID
                    </label>
                    <input
                      type="text"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      placeholder="e.g., TRK000001 or 123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && searchOrderByTrackingCode()}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={searchOrderByTrackingCode}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Track Order
                    </button>
                    <button
                      onClick={() => setShowTrackingModal(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>You can find your tracking code in:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Order confirmation email</li>
                      <li>Order details in your account</li>
                      <li>Order ID: #{orders.length > 0 ? orders[0].id : 'N/A'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  )
}
