'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  ShoppingBagIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

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
  paymentMethod: string
  subtotal: number
  discountAmount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  totalAmount: number
  createdAt: string
  items: OrderItem[]
  store: {
    id: number
    name: string
  }
}

export default function OrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingShipped, setMarkingShipped] = useState(false)
  const [markingDelivered, setMarkingDelivered] = useState(false)

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
    fetchOrderDetails()
  }, [session, status, router, orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      console.log('Fetching order details for ID:', orderId)
      const response = await fetch(`/api/orders/${orderId}`)
      console.log('Order API response status:', response.status)
      if (!response.ok) {
        const errorData = await response.json()
        console.log('Order API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch order details')
      }
      const orderData = await response.json()
      console.log('Order data received:', orderData)
      
      // Ensure all items have valid product data
      const safeOrderData = {
        ...orderData,
        items: orderData.items?.map((item: any) => ({
          ...item,
          product: item.product || { title: 'Unknown Product', sku: null }
        })) || []
      }
      
      setOrder(safeOrderData)
    } catch (err) {
      console.error('Order fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch order details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'SHIPPED': return 'bg-purple-100 text-purple-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ClockIcon className="h-4 w-4" />
      case 'CONFIRMED': return <CheckCircleIcon className="h-4 w-4" />
      case 'SHIPPED': return <TruckIcon className="h-4 w-4" />
      case 'DELIVERED': return <CheckCircleIcon className="h-4 w-4" />
      case 'CANCELLED': return <XCircleIcon className="h-4 w-4" />
      case 'REJECTED': return <XCircleIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const markAsShipped = async () => {
    if (!confirm('Are you sure you want to mark this order as shipped?')) {
      return
    }

    try {
      setMarkingShipped(true)
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
        setOrder(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to mark order as shipped')
      }
    } catch (error) {
      console.error('Error marking order as shipped:', error)
      setError('Failed to mark order as shipped')
    } finally {
      setMarkingShipped(false)
    }
  }

  const markAsDelivered = async () => {
    if (!confirm('Are you sure you want to mark this order as delivered?')) {
      return
    }

    try {
      setMarkingDelivered(true)
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
        setOrder(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to mark order as delivered')
      }
    } catch (error) {
      console.error('Error marking order as delivered:', error)
      setError('Failed to mark order as delivered')
    } finally {
      setMarkingDelivered(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading order details...</div>
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Order not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/seller/orders"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.toString().slice(-8)}</h1>
              <p className="text-sm text-gray-500">Order Details</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-2">{order.status}</span>
              </span>
              {order.status === 'CONFIRMED' && (
                <button
                  onClick={markAsShipped}
                  disabled={markingShipped}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {markingShipped ? 'Marking...' : 'Mark as Shipped'}
                </button>
              )}
              {order.status === 'SHIPPED' && (
                <button
                  onClick={markAsDelivered}
                  disabled={markingDelivered}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {markingDelivered ? 'Marking...' : 'Mark as Delivered'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
            Customer Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="text-sm font-medium text-gray-900">
                  {order.customerAddress ? order.customerAddress.fullName : order.buyerName}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="text-sm font-medium text-gray-900">
                  {order.customerAddress ? order.customerAddress.phone : order.phone}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2 text-gray-500" />
            Delivery Address
          </h2>
          {order.customerAddress ? (
            <div className="space-y-2">
              {order.customerAddress.title && (
                <div className="text-sm font-medium text-gray-900">
                  {order.customerAddress.title} Address
                </div>
              )}
              <div className="text-sm text-gray-600">
                {order.customerAddress.address || 'Address not available'}
              </div>
              <div className="text-sm text-gray-600">
                {order.customerAddress.city && order.customerAddress.state && order.customerAddress.pincode 
                  ? `${order.customerAddress.city}, ${order.customerAddress.state} - ${order.customerAddress.pincode}`
                  : 'Location details not available'
                }
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {order.address}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CurrencyRupeeIcon className="h-5 w-5 mr-2 text-gray-500" />
            Order Summary
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span className="text-sm">Discount ({order.discountType})</span>
                <span className="text-sm font-medium">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CreditCardIcon className="h-4 w-4" />
                <span>Payment: {order.paymentMethod}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Placed: {new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.product?.title || 'Unknown Product'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.product?.sku || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.qty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(item.priceSnap)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(item.priceSnap * item.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
