'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/money'
import type { CartItem } from '@/lib/cartStorage'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

interface BillingSummaryProps {
  items: CartItem[]
  onCompleteBill: (discount: { type: 'PERCENTAGE' | 'AMOUNT'; value: number }, taxRate: number) => void
  loading?: boolean
}

const DEFAULT_TAX_RATE = 18 // 18% GST

export default function BillingSummary({
  items,
  onCompleteBill,
  loading = false,
}: BillingSummaryProps) {
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'AMOUNT'>('AMOUNT')
  const [discountValue, setDiscountValue] = useState<string>('')
  const [taxRate, setTaxRate] = useState<string>(DEFAULT_TAX_RATE.toString())

  const subtotal = items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  )

  // Calculate discount
  let discountAmount = 0
  if (discountValue) {
    const value = parseFloat(discountValue) || 0
    if (discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * value) / 100
    } else {
      // Fixed amount discount in rupees
      discountAmount = Math.min(value, subtotal) // Don't allow discount more than subtotal
    }
  }

  // Calculate amount after discount
  const amountAfterDiscount = subtotal - discountAmount

  // Calculate tax-inclusive pricing
  // Tax is included in the price, so we extract it from the total
  // Taxable amount = Total / (1 + taxRate/100)
  // Tax amount = Total - Taxable amount
  const taxRateValue = parseFloat(taxRate) || 0
  let taxableAmount = 0
  let taxAmount = 0
  
  if (taxRateValue > 0 && amountAfterDiscount > 0) {
    taxableAmount = amountAfterDiscount / (1 + taxRateValue / 100)
    taxAmount = amountAfterDiscount - taxableAmount
  } else {
    taxableAmount = amountAfterDiscount
    taxAmount = 0
  }

  // Total is the amount after discount (which already includes tax)
  const totalAmount = amountAfterDiscount

  const handleCompleteBill = () => {
    const value = parseFloat(discountValue) || 0
    const discount = {
      type: discountType,
      value: Math.max(0, value), // Value in rupees for AMOUNT, percentage for PERCENTAGE
    }
    onCompleteBill(discount, Math.max(0, parseFloat(taxRate) || DEFAULT_TAX_RATE))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
      </div>
      <div className="p-4 space-y-4">
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

        {/* Discount Section */}
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <label className="block text-xs font-medium text-gray-700">Discount</label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => setDiscountType('AMOUNT')}
                  className={`px-3 py-2 text-sm font-medium border border-r-0 rounded-l-md ${
                    discountType === 'AMOUNT'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <CurrencyDollarIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('PERCENTAGE')}
                  className={`px-3 py-2 text-sm font-medium border rounded-r-md ${
                    discountType === 'PERCENTAGE'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Percentage"
                >
                  <span className="text-xs font-bold">%</span>
                </button>
              </div>
            </div>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              disabled={loading}
              min="0"
              max={discountType === 'PERCENTAGE' ? '100' : undefined}
              step={discountType === 'PERCENTAGE' ? '0.1' : '1'}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder={discountType === 'PERCENTAGE' ? '0' : '0'}
            />
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="text-green-600 font-medium">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Tax Section */}
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <label className="block text-xs font-medium text-gray-700">Tax Rate (%)</label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            disabled={loading}
            min="0"
            max="100"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            placeholder="18"
          />
          {taxAmount > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxable Amount:</span>
                <span className="text-gray-900 font-medium">
                  {formatCurrency(taxableAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({taxRate}%):</span>
                <span className="text-gray-900 font-medium">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-base font-semibold text-gray-900">Total:</span>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <button
          onClick={handleCompleteBill}
          disabled={items.length === 0 || loading}
          className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Complete Bill'}
        </button>
      </div>
    </div>
  )
}

