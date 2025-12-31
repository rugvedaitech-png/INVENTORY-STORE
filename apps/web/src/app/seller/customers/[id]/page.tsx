'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  ShoppingBagIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import Pagination from '@/components/Pagination'

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string | null
  userId: number | null
  user: { id: number; email: string; name: string | null; phone: string | null } | null
  createdAt: string
  updatedAt: string
  store: {
    id: number
    name: string
    slug: string
  }
}

interface Order {
  id: number
  buyerName: string
  phone: string
  address: string
  status: string
  paymentMethod: string
  subtotal: number
  discountAmount: number
  discountType: string
  totalAmount: number
  createdAt: string
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

interface CustomerDetailsResponse {
  customer: Customer
  orders: Order[]
  ordersPagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function CustomerDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersPagination, setOrdersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const fetchCustomerDetails = async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers/${customerId}?ordersPage=${page}&ordersLimit=10`)
      if (!response.ok) {
        throw new Error('Failed to fetch customer details')
      }
      const data: CustomerDetailsResponse = await response.json()
      setCustomer(data.customer)
      setOrders(data.orders)
      setOrdersPagination(data.ordersPagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer details')
    } finally {
      setLoading(false)
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
    fetchCustomerDetails()
  }, [session, status, router, customerId])

  const handleOrdersPageChange = (page: number) => {
    setOrdersPage(page)
    fetchCustomerDetails(page)
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading customer details...</div>
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

  if (!customer) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Customer not found</div>
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
              href="/seller/customers"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-lg">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-sm text-gray-500">Customer Details</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Customer ID</div>
            <div className="text-lg font-semibold text-gray-900">#{customer.id}</div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
            Contact Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="text-sm font-medium text-gray-900">{customer.email}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="text-sm font-medium text-gray-900">{customer.phone}</div>
              </div>
            </div>
            {customer.address && (
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="text-sm font-medium text-gray-900">{customer.address}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2 text-gray-500" />
            Account Status
          </h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Linked User Account</div>
              {customer.user ? (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Linked to {customer.user.email}
                  </span>
                </div>
              ) : (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    No user account linked
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-500">Store</div>
              <div className="text-sm font-medium text-gray-900">{customer.store.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Created</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(customer.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ShoppingBagIcon className="h-5 w-5 mr-2 text-gray-500" />
            Order Summary
          </h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Total Orders</div>
              <div className="text-2xl font-bold text-gray-900">{ordersPagination.total}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Spent</div>
              <div className="text-xl font-semibold text-green-600">
                {formatCurrency(orders.reduce((sum, order) => sum + order.totalAmount, 0))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ShoppingBagIcon className="h-5 w-5 mr-2 text-gray-500" />
            Order History ({ordersPagination.total})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {customer.user ? 
                  "This customer hasn't placed any orders yet." : 
                  "Orders will appear here once the customer is linked to a user account."
                }
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                      Order #{order.id.toString().slice(-8)}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{item.product.title}</span>
                          {item.product.sku && (
                            <span className="text-gray-500 ml-2">({item.product.sku})</span>
                          )}
                        </div>
                        <div className="text-gray-500">
                          Qty: {item.qty} × {formatCurrency(item.priceSnap)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Total */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Discount ({order.discountType === 'PERCENTAGE' ? '%' : 'Amount'})</span>
                        <span>-{formatCurrency(order.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold text-gray-900 mt-2">
                      <span>Total</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Pagination */}
        {ordersPagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination
              currentPage={ordersPagination.page}
              totalPages={ordersPagination.pages}
              totalItems={ordersPagination.total}
              itemsPerPage={ordersPagination.limit}
              onPageChange={handleOrdersPageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
