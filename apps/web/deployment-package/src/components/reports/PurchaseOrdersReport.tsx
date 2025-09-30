'use client'

import { useState, useEffect } from 'react'
import { 
  TruckIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import * as XLSX from 'xlsx'
import { exportElementToPDF, exportElementToPDFAlternative, exportStructuredPDF, exportTablePDF } from '@/lib/pdf-export'

interface PurchaseOrderData {
  id: number
  code: string
  supplier: {
    name: string
    email?: string
    phone?: string
  }
  status: string
  total: number
  subtotal: number
  taxTotal: number
  createdAt: string
  placedAt?: string
  items: Array<{
    product: {
      title: string
    }
    qty: number
    costPaise: number
    receivedQty: number
  }>
}

interface PurchaseOrdersReportData {
  purchaseOrders: PurchaseOrderData[]
  summary: {
    totalPurchaseOrders: number
    totalCost: number
    averageOrderValue: number
    statusBreakdown: {
      draft: number
      placed: number
      received: number
      cancelled: number
    }
    topSuppliers: Array<{
      supplierId: number
      name: string
      totalOrders: number
      totalCost: number
    }>
    topProducts: Array<{
      productId: number
      title: string
      totalQty: number
      totalCost: number
    }>
    monthlyTrends: Array<{
      month: string
      orders: number
      cost: number
    }>
  }
}

interface PurchaseOrdersReportProps {
  dateRange: string
  customDateRange?: {
    start: string
    end: string
  }
}

export default function PurchaseOrdersReport({ dateRange, customDateRange }: PurchaseOrdersReportProps) {
  const [data, setData] = useState<PurchaseOrdersReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchPurchaseOrdersData()
  }, [dateRange, customDateRange])

  const fetchPurchaseOrdersData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        range: dateRange,
        ...(dateRange === 'custom' && customDateRange?.start && { startDate: customDateRange.start }),
        ...(dateRange === 'custom' && customDateRange?.end && { endDate: customDateRange.end })
      })
      
      const response = await fetch(`/api/reports/purchase-orders?${params}`)
      if (!response.ok) throw new Error('Failed to fetch purchase orders data')
      const data = await response.json()
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchase orders data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'PLACED':
        return 'bg-blue-100 text-blue-800'
      case 'RECEIVED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <ClockIcon className="h-4 w-4" />
      case 'PLACED':
        return <TruckIcon className="h-4 w-4" />
      case 'RECEIVED':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  // Export functions
  const exportToCSV = () => {
    if (!data) return
    
    const csvData = data.purchaseOrders.map(po => ({
      'PO Code': po.code,
      'Supplier': po.supplier.name,
      'Status': po.status,
      'Total Cost': (po.total / 100).toFixed(2),
      'Items Count': po.items.length,
      'Created Date': formatDate(po.createdAt),
      'Placed Date': po.placedAt ? formatDate(po.placedAt) : 'N/A'
    }))
    
    const ws = XLSX.utils.json_to_sheet(csvData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders')
    XLSX.writeFile(wb, `purchase-orders-report-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToPDF = async () => {
    if (!data) return
    
    setExporting(true)
    try {
      // Use structured PDF export first (most reliable)
      await exportStructuredPDF({
        elementId: 'purchase-orders-report-content',
        filename: `purchase-orders-report-${new Date().toISOString().split('T')[0]}.pdf`,
        reportType: 'purchase-orders'
      })
    } catch (error) {
      console.error('Structured PDF export failed, trying table method:', error)
      try {
        // Fallback to table PDF export
        await exportTablePDF({
          elementId: 'purchase-orders-report-content',
          filename: `purchase-orders-report-${new Date().toISOString().split('T')[0]}.pdf`,
          reportType: 'purchase-orders'
        })
      } catch (tableError) {
        console.error('Table PDF export also failed, trying simple method:', tableError)
        try {
          // Final fallback to simple text-based export
          const { exportElementToPDFSimple } = await import('@/lib/pdf-export')
          await exportElementToPDFSimple({
            elementId: 'purchase-orders-report-content',
            filename: `purchase-orders-report-${new Date().toISOString().split('T')[0]}.pdf`
          })
        } catch (simpleError) {
          console.error('All PDF export methods failed:', simpleError)
          throw simpleError
        }
      }
    } finally {
      setExporting(false)
    }
  }

  // Chart data preparation
  const monthlyChartData = data?.summary.monthlyTrends.map(item => ({
    month: item.month,
    cost: item.cost / 100,
    orders: item.orders
  })) || []

  const statusChartData = data ? [
    { name: 'Draft', value: data.summary.statusBreakdown.draft, color: '#6B7280' },
    { name: 'Placed', value: data.summary.statusBreakdown.placed, color: '#3B82F6' },
    { name: 'Received', value: data.summary.statusBreakdown.received, color: '#10B981' },
    { name: 'Cancelled', value: data.summary.statusBreakdown.cancelled, color: '#EF4444' }
  ] : []

  const topSuppliersChartData = data?.summary.topSuppliers.slice(0, 5).map(supplier => ({
    name: supplier.name.length > 20 ? supplier.name.substring(0, 20) + '...' : supplier.name,
    cost: supplier.totalCost / 100,
    orders: supplier.totalOrders
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading purchase orders report...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-6xl mb-4">❌</div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading purchase orders report</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">No purchase orders data available.</div>
      </div>
    )
  }

  const { purchaseOrders, summary } = data
  const totalPages = Math.ceil(purchaseOrders.length / itemsPerPage)
  const paginatedOrders = purchaseOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div id="purchase-orders-report-content" className="space-y-6">
      {/* Export Buttons */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={exportToCSV}
          disabled={exporting || !data}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Export Excel
        </button>
        <button
          onClick={exportToPDF}
          disabled={exporting || !data}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          {exporting ? 'Generating PDF...' : 'Export PDF'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Purchase Orders
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {summary.totalPurchaseOrders}
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
                <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Cost
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(summary.totalCost)}
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
                <BuildingOfficeIcon className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Order Value
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(summary.averageOrderValue)}
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
                <ClockIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Draft Orders
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {summary.statusBreakdown.draft}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Purchase Order Status Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {summary.statusBreakdown.draft}
              </div>
              <div className="text-sm text-gray-500">Draft</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.statusBreakdown.placed}
              </div>
              <div className="text-sm text-gray-500">Placed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.statusBreakdown.received}
              </div>
              <div className="text-sm text-gray-500">Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {summary.statusBreakdown.cancelled}
              </div>
              <div className="text-sm text-gray-500">Cancelled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Cost Trend Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Cost Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'cost' ? `₹${value}` : value,
                  name === 'cost' ? 'Cost' : 'Orders'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="cost" 
                stroke="#EF4444" 
                fill="#EF4444" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Purchase Order Status Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Suppliers Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Suppliers by Cost</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topSuppliersChartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip formatter={(value) => [`₹${value}`, 'Cost']} />
            <Bar dataKey="cost" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Suppliers */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Top Suppliers
          </h3>
          <div className="space-y-3">
            {summary.topSuppliers.map((supplier, index) => (
              <div key={supplier.supplierId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium text-sm">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {supplier.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {supplier.totalOrders} orders
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(supplier.totalCost)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products by Purchase */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Top Purchased Products
          </h3>
          <div className="space-y-3">
            {summary.topProducts.map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-medium text-sm">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {product.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.totalQty} units purchased
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(product.totalCost)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Purchase Orders
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Detailed view of supplier purchase orders
          </p>
        </div>
        
        {/* Table Header */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-600 font-bold text-xs">
                            {order.code.slice(-4)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {order.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.supplier.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {order.supplier.email || order.supplier.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {order.items.length} items
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </div>
                    {order.placedAt && (
                      <div className="text-xs text-gray-400">
                        Placed: {formatDate(order.placedAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, purchaseOrders.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{purchaseOrders.length}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
