'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ShoppingBagIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline'
import Pagination from '@/components/Pagination'

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
  totalAmount: number
  createdAt: string
  store: {
    id: number
    name: string
    slug: string
    whatsapp: string | null
    upiId: string | null
  }
  items: {
    id: number
    qty: number
    priceSnap: number
    product: {
      id: number
      title: string
      sku: string | null
    }
  }[]
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

export default function CustomerOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Redirect if not authenticated or not customer
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    if (session.user.role !== 'CUSTOMER') {
      router.push('/unauthorized')
      return
    }
    fetchOrders()
  }, [session, status, router, currentPage])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customer/orders?page=${currentPage}&limit=10`)
      if (response.ok) {
        const data: OrdersResponse = await response.json()
        setOrders(data.orders || [])
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        })
      } else {
        console.error('Failed to fetch orders:', response.status, response.statusText)
        setOrders([])
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        })
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ShoppingBagIcon className="h-8 w-8 mr-3 text-blue-600" />
              My Orders
            </h1>
            <p className="mt-2 text-gray-600">
              Track and manage all your orders
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {pagination?.total || 0} order{(pagination?.total || 0) !== 1 ? 's' : ''} total
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
            <p className="mt-1 text-sm text-gray-500">Start shopping to see your orders here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
              <div key={order.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                        <ShoppingBagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                          Order #{order.id.toString().slice(-8)}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1.5">{order.status}</span>
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center">
                          <BuildingStorefrontIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="truncate max-w-[120px] sm:max-w-none">{order.store.name}</span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="font-semibold text-blue-600">Contact for Total</span>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-400">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex items-center justify-end sm:justify-start sm:space-x-3">
                    <span className="text-xs sm:text-sm font-medium text-blue-600 whitespace-nowrap">
                      Contact Store for Pricing
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-4 sm:mt-6">
                  <h5 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <ShoppingBagIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Order Items
                  </h5>
                  <div className="grid gap-2 sm:gap-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                              <ShoppingBagIcon className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h6 className="text-sm font-medium text-gray-900 truncate">
                                {item.product.title}
                              </h6>
                              <p className="text-xs text-gray-500">
                                SKU: {item.product.sku || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end sm:text-right gap-2 sm:gap-1">
                            <div className="text-sm font-medium text-gray-900">
                              Qty: {item.qty}
                            </div>
                            <div className="text-xs sm:text-sm text-blue-600">
                              Contact for Price
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Store Contact Information */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <BuildingStorefrontIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h6 className="text-sm font-medium text-blue-900 mb-2">
                          Contact {order.store.name} for Order Details
                        </h6>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p>• Order pricing and payment details</p>
                          <p>• Delivery arrangements and timing</p>
                          <p>• Any special requests or modifications</p>
                        </div>
                        {(order.store.whatsapp || order.store.upiId) && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            {order.store.whatsapp && (
                              <div className="text-xs text-blue-700">
                                WhatsApp: {order.store.whatsapp}
                              </div>
                            )}
                            {order.store.upiId && (
                              <div className="text-xs text-blue-700">
                                UPI: {order.store.upiId}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
