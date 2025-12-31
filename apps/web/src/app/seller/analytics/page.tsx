'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface AnalyticsData {
  revenue: {
    total: number
    monthly: number
    weekly: number
    daily: number
  }
  orders: {
    total: number
    confirmed: number
    pending: number
    rejected: number
    cancelled: number
  }
  products: {
    total: number
    lowStock: number
    outOfStock: number
  }
  customers: {
    total: number
    newThisMonth: number
    repeatCustomers: number
  }
  topProducts: Array<{
    id: number
    title: string
    totalSold: number
    revenue: number
  }>
  recentActivity: Array<{
    id: string
    type: 'order' | 'product' | 'customer'
    description: string
    timestamp: string
  }>
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [storeId, setStoreId] = useState<string | null>(null)

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
        fetchAnalytics(stores[0].id.toString())
      }
    } catch (err) {
      setError('Failed to fetch store information')
    }
  }

  const fetchAnalytics = async (storeIdParam?: string) => {
    if (!storeId && !storeIdParam) return
    const currentStoreId = storeIdParam || storeId
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?storeId=${currentStoreId}&range=${dateRange}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (storeId) {
      fetchAnalytics()
    }
  }, [dateRange, storeId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'
      case '90d': return 'Last 90 days'
      case '1y': return 'Last year'
      default: return 'Last 30 days'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-6xl mb-4">❌</div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading analytics</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">No analytics data available.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics & Reports</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track your store performance and business insights
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">₹</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(analytics.revenue.total)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">📈</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {getDateRangeLabel(dateRange)}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(analytics.revenue.monthly)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">📋</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Orders
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics.orders.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Customers
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics.customers.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Order Status Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.orders.confirmed}
              </div>
              <div className="text-sm text-gray-500">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.orders.pending}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {analytics.orders.rejected}
              </div>
              <div className="text-sm text-gray-500">Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {analytics.orders.cancelled}
              </div>
              <div className="text-sm text-gray-500">Cancelled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.orders.total}
              </div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Top Selling Products
          </h3>
          <div className="space-y-3">
            {analytics.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {product.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.totalSold} units sold
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center py-2">
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'order' ? 'bg-blue-500' :
                    activity.type === 'product' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}></div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-sm text-gray-900">
                    {activity.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
