'use client'

import { formatCurrency } from '@/lib/money'
import type { CartItem } from '@/lib/cartStorage'

interface BillingSummaryProps {
  items: CartItem[]
  onCompleteBill: () => void
  loading?: boolean
}

export default function BillingSummary({
  items,
  onCompleteBill,
  loading = false,
}: BillingSummaryProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  )
  const discountAmount = 0
  const totalAmount = subtotal - discountAmount

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Items:</span>
          <span className="text-gray-900 font-medium">{items.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="text-gray-900 font-medium">
            {formatCurrency(subtotal)}
          </span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discount:</span>
            <span className="text-green-600 font-medium">
              -{formatCurrency(discountAmount)}
            </span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-base font-semibold text-gray-900">Total:</span>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
        <button
          onClick={onCompleteBill}
          disabled={items.length === 0 || loading}
          className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Complete Bill'}
        </button>
      </div>
    </div>
  )
}

