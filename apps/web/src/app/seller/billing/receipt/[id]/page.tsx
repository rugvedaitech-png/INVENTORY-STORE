'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { numberToWords } from '@/lib/numberToWords'
import { PrinterIcon, ArrowLeftIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface OrderItem {
  id: number
  productId: number
  productTitle: string
  productSku: string | null
  qty: number
  price: number
  mrp: number
  lineTotal: number
}

interface Order {
  id: number
  orderNumber: string
  buyerName: string
  phone: string
  status: string
  paymentMethod: string
  subtotal: number
  discountAmount: number
  totalAmount: number
  createdAt: string
  store: {
    id: number
    name: string
    whatsapp: string | null
    upiId: string | null
    billLayout: 'VERTICAL' | 'REGULAR'
  }
  items: OrderItem[]
}

function ReceiptPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params?.id as string
  const shouldPrint = searchParams?.get('print') === 'true'
  const fromOrders = searchParams?.get('from') === 'orders'

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasPrinted, setHasPrinted] = useState(false)

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
    if (orderId) {
      fetchOrder()
    }
  }, [session, status, router, orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/billing/get?id=${orderId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }
      const data = await response.json()
      setOrder(data.order)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order')
    } finally {
      setLoading(false)
    }
  }

  // Auto-print when order is loaded and print parameter is present
  useEffect(() => {
    if (order && shouldPrint && !hasPrinted && !loading) {
      // Small delay to ensure page is fully rendered
      const timer = setTimeout(() => {
        window.print()
        setHasPrinted(true)
        // Remove print parameter from URL after printing
        router.replace(`/seller/billing/receipt/${orderId}`)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [order, shouldPrint, hasPrinted, loading, orderId, router])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <Link
            href={fromOrders ? "/seller/orders" : "/seller/billing"}
            className="text-blue-600 hover:text-blue-800"
          >
            {fromOrders ? "Back to Orders" : "Back to Billing"}
          </Link>
        </div>
      </div>
    )
  }

  // Calculate totals
  const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0)
  const totalItems = order.items.length
  const grossAmount = order.subtotal
  const totalPayable = order.totalAmount
  
  // Calculate GST (18% = 9% CGST + 9% SGST)
  const GST_RATE = 18 // 18% total GST
  const CGST_RATE = 9 // 9% CGST
  const SGST_RATE = 9 // 9% SGST
  
  // Calculate basic rate (amount before GST)
  // If total includes GST: basicRate = total / (1 + GST_RATE/100)
  // For simplicity, we'll calculate from the line total
  const calculateGST = (amount: number) => {
    const basicRate = amount / (1 + GST_RATE / 100)
    const cgst = basicRate * (CGST_RATE / 100)
    const sgst = basicRate * (SGST_RATE / 100)
    const totalGST = cgst + sgst
    return { basicRate, cgst, sgst, totalGST }
  }
  
  // Calculate GST for each item
  const itemsWithGST = order.items.map((item) => {
    const gst = calculateGST(item.lineTotal)
    return { ...item, ...gst }
  })
  
  // Calculate total GST
  const totalBasicRate = itemsWithGST.reduce((sum, item) => sum + item.basicRate, 0)
  const totalCGST = itemsWithGST.reduce((sum, item) => sum + item.cgst, 0)
  const totalSGST = itemsWithGST.reduce((sum, item) => sum + item.sgst, 0)
  const totalGST = totalCGST + totalSGST
  
  const savings = order.items.reduce((sum, item) => {
    const mrpTotal = item.mrp * item.qty
    const actualTotal = item.lineTotal
    return sum + (mrpTotal - actualTotal)
  }, 0)

  // Format date and time
  const orderDate = new Date(order.createdAt)
  const dateStr = orderDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timeStr = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  // Format phone number
  const formatPhone = (phone: string) => {
    if (!phone) return ''
    if (phone.length === 10) {
      return phone
    }
    if (phone.length > 10) {
      return phone.slice(-10)
    }
    return phone
  }

  // Determine bill layout (default to REGULAR if not set)
  const billLayout = order.store.billLayout || 'REGULAR'

  // Render Vertical Layout (Current Regular Format - Compact for Thermal Printers)
  const renderVerticalLayout = () => (
    <div className="receipt-container bg-white rounded-lg shadow-lg p-6 print:shadow-none print:p-4 max-w-lg mx-auto">
      {/* Logo */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-black rounded mb-2">
          <ShoppingCartIcon className="h-10 w-10 text-black" />
        </div>
      </div>

      {/* Store Name */}
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-black uppercase tracking-wide">
          {order.store.name}
        </h1>
      </div>

      {/* Store Address - Placeholder */}
      <div className="text-center text-xs text-gray-700 mb-2">
        <p>Address Line 1</p>
        <p>Address Line 2, City - PIN</p>
      </div>

      {/* Phone Numbers */}
      {order.store.whatsapp && (
        <div className="text-center text-xs text-gray-700 mb-2">
          <p>Phone: {formatPhone(order.store.whatsapp)}</p>
        </div>
      )}

      {/* GSTIN and FSSAI - Placeholders */}
      <div className="text-center text-xs text-gray-700 mb-4 border-t border-gray-300 pt-2">
        <p>GSTIN: -</p>
        <p>FSSAI: -</p>
      </div>

      {/* Invoice Type and Details */}
      <div className="border-t-2 border-b-2 border-black py-2 mb-4">
        <div className="text-center mb-2">
          <p className="text-sm font-semibold text-black">TAX INVOICE</p>
        </div>
        <div className="flex justify-between text-xs text-black">
          <div>
            <p>Bill No: <span className="font-semibold">{order.id}</span></p>
          </div>
          <div className="text-right">
            <p>Date: <span className="font-semibold">{dateStr}</span></p>
            <p>Time: <span className="font-semibold">{timeStr}</span></p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="text-left py-1 px-1 font-semibold text-black">HSN/SAC</th>
              <th className="text-left py-1 px-1 font-semibold text-black">Item Description</th>
              <th className="text-right py-1 px-1 font-semibold text-black">MRP</th>
              <th className="text-right py-1 px-1 font-semibold text-black">Rate</th>
              <th className="text-right py-1 px-1 font-semibold text-black">Qty</th>
              <th className="text-center py-1 px-1 font-semibold text-black">UOM</th>
              <th className="text-center py-1 px-1 font-semibold text-black">GST</th>
              <th className="text-right py-1 px-1 font-semibold text-black">Amount</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithGST.map((item, index) => (
              <tr key={item.id} className={index < order.items.length - 1 ? 'border-b border-gray-300' : ''}>
                <td className="py-1 px-1 text-gray-700">{item.productSku || '-'}</td>
                <td className="py-1 px-1 text-gray-700">
                  {item.productTitle}
                </td>
                <td className="py-1 px-1 text-right text-gray-700">
                  {(item.mrp / 100).toFixed(2)}
                </td>
                <td className="py-1 px-1 text-right text-gray-700">
                  {(item.price / 100).toFixed(2)}
                </td>
                <td className="py-1 px-1 text-right text-gray-700">{item.qty}</td>
                <td className="py-1 px-1 text-center text-gray-700">NOS</td>
                <td className="py-1 px-1 text-center text-gray-700">18%</td>
                <td className="py-1 px-1 text-right font-semibold text-black">
                  {(item.lineTotal / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="border-t border-b border-gray-400 py-2 mb-4">
        <div className="flex justify-between text-xs text-black mb-1">
          <span>Qty:</span>
          <span className="font-semibold">{totalQty}</span>
        </div>
        <div className="flex justify-between text-xs text-black mb-1">
          <span>Items:</span>
          <span className="font-semibold">{totalItems.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-black mb-1">
          <span>Gross Amt:</span>
          <span className="font-semibold">{(grossAmount / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-black mb-1">
          <span>Total Payable:</span>
          <span className="font-semibold">{(totalPayable / 100).toFixed(2)}</span>
        </div>
        {order.paymentMethod && (
          <div className="flex justify-between text-xs text-black mb-1">
            <span>Payment Method:</span>
            <span className="font-semibold">{order.paymentMethod}</span>
          </div>
        )}
      </div>

      {/* Amount in Words */}
      <div className="border-b border-gray-400 pb-2 mb-4">
        <p className="text-xs text-black">
          <span className="font-semibold">Amount in words:</span>{' '}
          <span className="italic">{numberToWords(totalPayable)}</span>
        </p>
      </div>

      {/* Savings */}
      {savings > 0 && (
        <div className="mb-4">
          <p className="text-xs text-black text-center">
            <span className="font-semibold">Savings:</span> YOU HAVE SAVED ON MRP RS: {(savings / 100).toFixed(2)}
          </p>
        </div>
      )}

      {/* Tax Summary */}
      <div className="border-t border-b border-gray-400 py-2 mb-4">
        <p className="text-xs font-semibold text-black mb-2">Including Tax Summary:</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1 px-1 font-semibold text-black">GST%</th>
              <th className="text-right py-1 px-1 font-semibold text-black">Basic Rate</th>
              <th className="text-right py-1 px-1 font-semibold text-black">CGST%</th>
              <th className="text-right py-1 px-1 font-semibold text-black">CGST</th>
              <th className="text-right py-1 px-1 font-semibold text-black">SGST%</th>
              <th className="text-right py-1 px-1 font-semibold text-black">SGST</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 px-1 text-gray-700">18%</td>
              <td className="py-1 px-1 text-right text-gray-700">
                {(totalBasicRate / 100).toFixed(2)}
              </td>
              <td className="py-1 px-1 text-right text-gray-700">9%</td>
              <td className="py-1 px-1 text-right text-gray-700">
                {(totalCGST / 100).toFixed(2)}
              </td>
              <td className="py-1 px-1 text-right text-gray-700">9%</td>
              <td className="py-1 px-1 text-right text-gray-700">
                {(totalSGST / 100).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="flex justify-between text-xs text-black mt-2 pt-2 border-t border-gray-300">
          <span className="font-semibold">Total GST:</span>
          <span className="font-semibold">{(totalGST / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-black mt-1">
          <span className="font-semibold">Total (Overall Amount):</span>
          <span className="font-semibold">{(totalPayable / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-400 pt-2">
        <div className="flex justify-between text-xs text-black mb-2">
          <span>Lvl.No: 0</span>
          <span>User: {session?.user?.id || '-'}</span>
          <span>SM: 0</span>
        </div>
        <div className="text-center text-xs text-black font-semibold mt-4">
          <p>THANK YOU</p>
          <p>VISIT AGAIN</p>
        </div>
      </div>
    </div>
  )

  // Render Regular Layout (New Modern Professional Invoice Format)
  const renderRegularLayout = () => (
    <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none print:p-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="border-b-2 border-gray-300 pb-6 mb-6">
        <div className="flex justify-between items-start">
          {/* Store Info */}
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <ShoppingCartIcon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {order.store.name}
                </h1>
                <p className="text-sm text-gray-600">Tax Invoice</p>
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Address Line 1, Address Line 2</p>
              <p>City - PIN Code</p>
              {order.store.whatsapp && (
                <p>Phone: {formatPhone(order.store.whatsapp)}</p>
              )}
              <p>GSTIN: - | FSSAI: -</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="text-right">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h2 className="text-lg font-bold text-blue-900 mb-3">INVOICE</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Invoice #:</span>
                  <span className="font-semibold text-gray-900">{order.id}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold text-gray-900">{dateStr}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-semibold text-gray-900">{timeStr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer & Billing Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Bill To</h3>
          <div className="bg-gray-50 rounded p-3 text-sm">
            <p className="font-medium text-gray-900">{order.buyerName}</p>
            <p className="text-gray-600">{order.phone}</p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Payment Details</h3>
          <div className="bg-gray-50 rounded p-3 text-sm">
            <p className="text-gray-600">Method: <span className="font-medium text-gray-900">{order.paymentMethod || 'N/A'}</span></p>
            <p className="text-gray-600">Status: <span className="font-medium text-gray-900">{order.status}</span></p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">#</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Item Description</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">HSN/SAC</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Qty</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Rate</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">GST</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Amount</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithGST.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                <td className="py-3 px-4 text-sm">
                  <div className="font-medium text-gray-900">{item.productTitle}</div>
                  {item.productSku && (
                    <div className="text-xs text-gray-500 mt-1">SKU: {item.productSku}</div>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-center text-gray-600">{item.productSku || '-'}</td>
                <td className="py-3 px-4 text-sm text-right text-gray-600">{item.qty}</td>
                <td className="py-3 px-4 text-sm text-right text-gray-600">{(item.price / 100).toFixed(2)}</td>
                <td className="py-3 px-4 text-sm text-right text-gray-600">18%</td>
                <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                  {(item.lineTotal / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Left: Amount in Words */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Amount in Words</h4>
          <p className="text-sm text-gray-900 italic">
            {numberToWords(totalPayable)}
          </p>
        </div>

        {/* Right: Totals */}
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="text-sm font-medium text-gray-900">{(grossAmount / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">CGST (9%):</span>
            <span className="text-sm font-medium text-gray-900">{(totalCGST / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">SGST (9%):</span>
            <span className="text-sm font-medium text-gray-900">{(totalSGST / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b-2 border-gray-300">
            <span className="text-sm text-gray-600">Total GST:</span>
            <span className="text-sm font-medium text-gray-900">{(totalGST / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-4 mt-2">
            <span className="text-base font-bold text-gray-900">Total Amount:</span>
            <span className="text-lg font-bold text-blue-600">{(totalPayable / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Tax Summary Table */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Tax Summary</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 font-semibold text-gray-700">GST%</th>
                <th className="text-right py-2 font-semibold text-gray-700">Taxable Amount</th>
                <th className="text-right py-2 font-semibold text-gray-700">CGST</th>
                <th className="text-right py-2 font-semibold text-gray-700">SGST</th>
                <th className="text-right py-2 font-semibold text-gray-700">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 text-gray-600">18%</td>
                <td className="py-2 text-right text-gray-600">{(totalBasicRate / 100).toFixed(2)}</td>
                <td className="py-2 text-right text-gray-600">{(totalCGST / 100).toFixed(2)}</td>
                <td className="py-2 text-right text-gray-600">{(totalSGST / 100).toFixed(2)}</td>
                <td className="py-2 text-right font-semibold text-gray-900">{(totalGST / 100).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Savings (if applicable) */}
      {savings > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 text-center">
            <span className="font-semibold">You saved:</span> {(savings / 100).toFixed(2)} on MRP
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6">
        <div className="flex justify-between items-center mb-4 text-xs text-gray-500">
          <span>Invoice Generated by: User #{session?.user?.id || '-'}</span>
          <span>Thank you for your business!</span>
        </div>
        <div className="text-center text-sm text-gray-600">
          <p className="font-semibold mb-1">For any queries, please contact us</p>
          <p>This is a computer-generated invoice and does not require a signature</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:min-h-0">
      <div className={`${billLayout === 'VERTICAL' ? 'max-w-2xl' : 'max-w-6xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-0 print:px-0 print:max-w-none`}>
        {/* Action Buttons */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href={fromOrders ? "/seller/orders" : "/seller/billing"}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {fromOrders ? "Back to Orders" : "Back to Billing"}
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            Print Receipt
          </button>
        </div>

        {/* Receipt - Conditional Layout */}
        {billLayout === 'VERTICAL' ? renderVerticalLayout() : renderRegularLayout()}
      </div>

      {/* Print Styles - Optimized for both layouts */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${billLayout === 'VERTICAL' ? '80mm auto' : 'A4'};
            margin: ${billLayout === 'VERTICAL' ? '0' : '10mm'};
            padding: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            background: white !important;
            padding: 0 !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:py-4 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          .print\\:p-4 {
            padding: 0.5rem !important;
          }
          /* Receipt container - Optimized for thermal printers (vertical layout) */
          .receipt-container {
            width: 79.5mm !important;
            max-width: 79.5mm !important;
            margin: 0 auto !important;
            padding: 1mm 0.25mm !important;
            font-family: 'Courier New', 'Monaco', 'Menlo', monospace !important;
            font-size: 9pt !important;
            box-sizing: border-box !important;
            color: black !important;
          }
          
          /* Regular layout uses standard A4 printing */
          ${billLayout === 'REGULAR' ? `
          body > div > div {
            max-width: 100% !important;
            padding: 0 !important;
          }
          ` : ''}
          /* Store name and headers - optimized for thermal printing */
          .receipt-container h1, 
          .receipt-container h2, 
          .receipt-container h3 {
            font-family: 'Courier New', 'Monaco', 'Menlo', monospace !important;
            font-size: 10pt !important;
            font-weight: bold !important;
            margin: 1mm 0 !important;
            line-height: 1.2 !important;
            text-align: center !important;
            letter-spacing: 0.5px !important;
          }
          /* Body text - thermal printer optimized */
          .receipt-container p, 
          .receipt-container span, 
          .receipt-container div {
            font-family: 'Courier New', 'Monaco', 'Menlo', monospace !important;
            font-size: 8pt !important;
            line-height: 1.2 !important;
            color: black !important;
          }
          /* Tables - fixed width for thermal printer alignment */
          .receipt-container table {
            width: 100% !important;
            max-width: 79mm !important;
            font-family: 'Courier New', 'Monaco', 'Menlo', monospace !important;
            font-size: 7pt !important;
            border-collapse: collapse !important;
            margin: 1mm 0 !important;
            table-layout: fixed !important;
          }
          .receipt-container th, 
          .receipt-container td {
            padding: 0.5mm 0.25mm !important;
            font-family: 'Courier New', 'Monaco', 'Menlo', monospace !important;
            font-size: 7pt !important;
            line-height: 1.1 !important;
            word-wrap: break-word !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            border: none !important;
            color: black !important;
          }
          .receipt-container th {
            font-weight: bold !important;
            text-align: left !important;
          }
          .receipt-container td {
            text-align: left !important;
          }
          /* Right-aligned numeric columns */
          .receipt-container td[class*="text-right"],
          .receipt-container th[class*="text-right"] {
            text-align: right !important;
          }
          /* Center-aligned columns */
          .receipt-container td[class*="text-center"],
          .receipt-container th[class*="text-center"] {
            text-align: center !important;
          }
          /* Optimize borders for thermal printing */
          .receipt-container [class*="border"] {
            border-color: black !important;
            border-width: 0.5pt !important;
          }
          /* Ensure all text is black for thermal printers */
          .receipt-container * {
            color: black !important;
          }
          /* Remove any background colors that won't print well */
          .receipt-container [class*="bg-"] {
            background: white !important;
          }
          /* Ensure no page breaks */
          .receipt-container {
            page-break-inside: avoid !important;
          }
          /* Hide sidebar in print */
          aside,
          [class*="sidebar"],
          nav[class*="sidebar"] {
            display: none !important;
          }
          /* Remove outer container padding in print */
          body > div {
            padding: 0 !important;
            margin: 0 !important;
            ${billLayout === 'VERTICAL' ? 'width: 80mm !important; max-width: 80mm !important;' : 'width: 100% !important; max-width: 100% !important;'}
          }
          /* Center receipt on page and remove flex layout */
          body {
            display: block !important;
            ${billLayout === 'VERTICAL' ? 'width: 80mm !important; max-width: 80mm !important;' : 'width: 100% !important; max-width: 100% !important;'}
          }
          /* Remove flex layout from main container */
          body > div > div[class*="flex"] {
            display: block !important;
          }
          /* Hide main content wrapper padding in print */
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading receipt...</p>
          </div>
        </div>
      }
    >
      <ReceiptPageContent />
    </Suspense>
  )
}
