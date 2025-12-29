'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { generateWhatsAppDeepLink, generateOrderConfirmationRequest } from '@/lib/whatsapp'
import { formatCurrency } from '@/lib/money'

interface Order {
  id: string
  createdAt: Date
  updatedAt: Date
  phone: string
  address: string
  storeId: number
  status: string
  buyerName: string
  paymentMethod: string
  paymentRef: string | null
  subtotal: number
  discountAmount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  totalAmount: number
  items: Array<{
    id: string
    qty: number
    priceSnap: number
    product: {
      title: string
    }
  }>
  store: {
    id: number
    name: string
    slug: string
    ownerId: number
    whatsapp: string | null
    upiId: string | null
    currency: string
    billLayout: 'VERTICAL' | 'REGULAR'
    createdAt: Date
    updatedAt: Date
  }
}

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const storeSlug = searchParams.get('store')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is required')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        if (!response.ok) {
          throw new Error('Order not found')
        }
        const orderData = await response.json()
        setOrder(orderData)
      } catch {
        setError('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Order not found'}
          </h1>
          <p className="text-gray-600 mb-8">
            Please contact support if you continue to have issues.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Generate appropriate WhatsApp link based on order status
  // Temporarily treat PENDING COD orders as awaiting confirmation
  const isAwaitingConfirmation = order.status === 'AWAITING_CONFIRMATION' || 
    (order.status === 'PENDING' && order.paymentMethod === 'COD')
  
  // Ensure store has billLayout (default to REGULAR if missing for backward compatibility)
  const storeWithBillLayout = {
    ...order.store,
    billLayout: order.store.billLayout || 'REGULAR' as 'VERTICAL' | 'REGULAR'
  }
  
  const whatsappUrl = isAwaitingConfirmation
    ? generateOrderConfirmationRequest(storeWithBillLayout as any, order as any)
    : generateWhatsAppDeepLink(storeWithBillLayout as any, order as any)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          {isAwaitingConfirmation ? (
            <>
              <div className="text-yellow-600 text-6xl mb-4">⏳</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order Submitted for Confirmation!
              </h1>
              <p className="text-gray-600">
                Your COD order #{order.id} has been submitted and is awaiting store owner confirmation.
              </p>
            </>
          ) : (
            <>
              <div className="text-green-600 text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order Placed Successfully!
              </h1>
              <p className="text-gray-600">
                Your order #{order.id} has been received and is being processed.
              </p>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Details
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{order.buyerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{order.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-yellow-600">{order.status}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(order.discountAmount)}
                  {order.discountType === 'PERCENTAGE' ? ` (${order.discountAmount}%)` : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600 font-semibold">Total Amount:</span>
              <span className="font-bold text-lg">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Items
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{item.product.title}</p>
                  <p className="text-sm text-gray-600">Qty: {item.qty}</p>
                </div>
                <p className="font-medium text-blue-600">Contact for Price</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Delivery Address
          </h2>
          <p className="text-gray-700 whitespace-pre-line">{order.address}</p>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isAwaitingConfirmation 
              ? 'Request Order Confirmation via WhatsApp' 
              : 'Notify Seller on WhatsApp'
            }
          </h2>
          <p className="text-gray-600 mb-6">
            {isAwaitingConfirmation 
              ? 'Click the button below to send a confirmation request to the store owner via WhatsApp. They will check stock availability and confirm your order.'
              : 'Click the button below to send your order details to the seller via WhatsApp.'
            }
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            {isAwaitingConfirmation 
              ? 'Request Confirmation via WhatsApp' 
              : 'Send Order via WhatsApp'
            }
          </a>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => window.location.href = `/${storeSlug || ''}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}
