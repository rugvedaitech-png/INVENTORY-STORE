'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/money'

interface OrderConfirmationActionsProps {
  order: {
    id: number
    status: string
    paymentMethod: string
    totalAmount: number
    items: Array<{
      id: number
      qty: number
      priceSnap: number
      product: {
        title: string
        stock: number
      }
    }>
  }
  onStatusChange: () => void
}

export default function OrderConfirmationActions({ order, onStatusChange }: OrderConfirmationActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showStockCheck, setShowStockCheck] = useState(false)
  const [confirmationReason, setConfirmationReason] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [actionType, setActionType] = useState<'confirm' | 'reject' | null>(null)

  const handleConfirm = async () => {
    setActionType('confirm')
    setShowReasonModal(true)
  }

  const handleReject = async () => {
    setActionType('reject')
    setShowReasonModal(true)
  }

  const handleConfirmWithReason = async () => {
    setLoading(true)
    try {
      console.log('Confirming order:', order.id, 'Status:', order.status, 'Payment:', order.paymentMethod)
      
      const response = await fetch(`/api/orders/${order.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'confirm',
          reason: confirmationReason || 'Order confirmed by store owner'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Confirmation error:', error)
        throw new Error(error.error || 'Failed to confirm order')
      }

      setShowReasonModal(false)
      setConfirmationReason('')
      onStatusChange()
    } catch (error) {
      console.error('Error confirming order:', error)
      alert(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectWithReason = async () => {
    setLoading(true)
    try {
      console.log('Rejecting order:', order.id, 'Status:', order.status, 'Payment:', order.paymentMethod)
      
      const response = await fetch(`/api/orders/${order.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'reject',
          reason: rejectionReason || 'Order rejected by store owner'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Rejection error:', error)
        throw new Error(error.error || 'Failed to reject order')
      }

      setShowReasonModal(false)
      setRejectionReason('')
      onStatusChange()
    } catch (error) {
      console.error('Error rejecting order:', error)
      alert(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const checkStockAvailability = () => {
    const insufficientStock = order.items.filter(item => item.product.stock < item.qty)
    return insufficientStock
  }

  // Check if this order needs confirmation (either AWAITING_CONFIRMATION or PENDING COD)
  const needsConfirmation = order.status === 'AWAITING_CONFIRMATION' || 
    (order.status === 'PENDING' && order.paymentMethod === 'COD')
    
  console.log('Order confirmation check:', {
    orderId: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    needsConfirmation
  })
    
  if (!needsConfirmation) {
    return null
  }

  const insufficientStock = checkStockAvailability()

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800">
              COD Order Awaiting Confirmation
            </h3>
            <div className="mt-2 text-sm text-orange-700">
              <p>This order requires your confirmation before processing. Please check stock availability and confirm.</p>
            </div>
          </div>
        </div>
      </div>

      {insufficientStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Insufficient Stock
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>The following items have insufficient stock:</p>
                <ul className="list-disc list-inside mt-1">
                  {insufficientStock.map((item) => (
                    <li key={item.id}>
                      {item.product.title}: Available {item.product.stock}, Required {item.qty}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h4>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.product.title} × {item.qty}
              </span>
              <span className="font-medium">
                {formatCurrency(item.priceSnap * item.qty)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between text-sm font-medium">
            <span>Total:</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleConfirm}
          disabled={loading || insufficientStock.length > 0}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Processing...' : 'Confirm Order'}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Processing...' : 'Reject Order'}
        </button>
      </div>

      {insufficientStock.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Cannot confirm order due to insufficient stock. Please restock items or reject the order.
        </p>
      )}

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionType === 'confirm' ? 'Confirm Order' : 'Reject Order'}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'confirm' ? 'Confirmation Reason (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  value={actionType === 'confirm' ? confirmationReason : rejectionReason}
                  onChange={(e) => actionType === 'confirm' ? setConfirmationReason(e.target.value) : setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={actionType === 'confirm' ? 'Add a note about why you\'re confirming this order...' : 'Please provide a reason for rejecting this order...'}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReasonModal(false)
                    setConfirmationReason('')
                    setRejectionReason('')
                    setActionType(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={actionType === 'confirm' ? handleConfirmWithReason : handleRejectWithReason}
                  disabled={loading || (actionType === 'reject' && !rejectionReason.trim())}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : (actionType === 'confirm' ? 'Confirm Order' : 'Reject Order')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
