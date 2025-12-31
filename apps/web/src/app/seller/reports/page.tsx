'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ShoppingCartIcon, 
  TruckIcon,
  CalendarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import OrdersReport from '@/components/reports/OrdersReport'
import PurchaseOrdersReport from '@/components/reports/PurchaseOrdersReport'

type ReportType = 'overview' | 'orders' | 'purchase-orders' | 'customers' | 'suppliers'

interface ReportSummary {
  totalOrders: number
  totalPurchaseOrders: number
  totalRevenue: number
  totalPurchaseCost: number
  netProfit: number
  pendingOrders: number
  pendingPurchaseOrders: number
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeReport, setActiveReport] = useState<ReportType>('overview')
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'custom'>('30d')
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/auth/login')
      return
    }
    fetchReportSummary()
  }, [session, status, router, dateRange, customDateRange])

  const fetchReportSummary = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        range: dateRange,
        ...(dateRange === 'custom' && customDateRange.start && { startDate: customDateRange.start }),
        ...(dateRange === 'custom' && customDateRange.end && { endDate: customDateRange.end })
      })
      
      const response = await fetch(`/api/reports/summary?${params}`)
      if (!response.ok) throw new Error('Failed to fetch report summary')
      const data = await response.json()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports')
    } finally {
      setLoading(false)
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

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'
      case '90d': return 'Last 90 days'
      case '1y': return 'Last year'
      case 'custom': return 'Custom range'
      default: return 'Last 30 days'
    }
  }

  const reportTabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon, description: 'Key metrics and summary' },
    { id: 'orders', name: 'Customer Orders', icon: ShoppingCartIcon, description: 'Order analysis and trends' },
    { id: 'purchase-orders', name: 'Purchase Orders', icon: TruckIcon, description: 'Supplier purchase analysis' },
    { id: 'customers', name: 'Customer Reports', icon: DocumentTextIcon, description: 'Customer behavior and insights' },
    { id: 'suppliers', name: 'Supplier Reports', icon: TruckIcon, description: 'Supplier performance analysis' },
  ]

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading reports...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-6xl mb-4">❌</div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading reports</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={fetchReportSummary}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Comprehensive reports for orders, purchases, customers, and suppliers
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Export Button */}
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {reportTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id as ReportType)}
                className={`
                  group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm
                  ${activeReport === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Summary Cards */}
      {summary && (
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
                      {formatCurrency(summary.totalRevenue)}
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
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Purchase Cost
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(summary.totalPurchaseCost)}
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
                      Net Profit
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(summary.netProfit)}
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
                    <span className="text-white font-bold">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {summary.pendingOrders + summary.pendingPurchaseOrders}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {activeReport === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Overview Report - {getDateRangeLabel(dateRange)}
              </h3>
              <p className="text-sm text-gray-600">
                Comprehensive overview of your store's performance including orders, purchases, and financial metrics.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Quick Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Orders:</span>
                      <span className="text-sm font-medium">{summary?.totalOrders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Revenue:</span>
                      <span className="text-sm font-medium">{formatCurrency(summary?.totalRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Purchase Orders:</span>
                      <span className="text-sm font-medium">{summary?.totalPurchaseOrders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Purchase Cost:</span>
                      <span className="text-sm font-medium">{formatCurrency(summary?.totalPurchaseCost || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Financial Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Net Profit:</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(summary?.netProfit || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Profit Margin:</span>
                      <span className="text-sm font-medium">
                        {summary?.totalRevenue ? 
                          `${(((summary.netProfit || 0) / summary.totalRevenue) * 100).toFixed(1)}%` : 
                          '0%'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pending Orders:</span>
                      <span className="text-sm font-medium">{summary?.pendingOrders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pending Purchases:</span>
                      <span className="text-sm font-medium">{summary?.pendingPurchaseOrders || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeReport === 'orders' && (
            <OrdersReport 
              dateRange={dateRange} 
              customDateRange={dateRange === 'custom' ? customDateRange : undefined}
            />
          )}

          {activeReport === 'purchase-orders' && (
            <PurchaseOrdersReport 
              dateRange={dateRange} 
              customDateRange={dateRange === 'custom' ? customDateRange : undefined}
            />
          )}

          {activeReport === 'customers' && (
            <div className="space-y-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Customer Reports
              </h3>
              <p className="text-sm text-gray-600">
                Customer behavior analysis, purchase patterns, and customer insights.
              </p>
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Customer Reports</h3>
                <p className="mt-1 text-sm text-gray-500">Coming soon - detailed customer analytics and insights.</p>
              </div>
            </div>
          )}

          {activeReport === 'suppliers' && (
            <div className="space-y-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Supplier Reports
              </h3>
              <p className="text-sm text-gray-600">
                Supplier performance analysis, delivery times, and cost analysis.
              </p>
              <div className="text-center py-12">
                <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Supplier Reports</h3>
                <p className="mt-1 text-sm text-gray-500">Coming soon - detailed supplier performance analytics.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
