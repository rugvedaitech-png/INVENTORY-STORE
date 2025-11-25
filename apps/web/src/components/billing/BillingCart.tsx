'use client'

import { MinusIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/money'
import type { CartItem } from '@/lib/cartStorage'

interface BillingCartProps {
  items: CartItem[]
  onUpdateQty: (productId: number, qty: number) => void
  onRemoveItem: (productId: number) => void
}

export default function BillingCart({
  items,
  onUpdateQty,
  onRemoveItem,
}: BillingCartProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-lg">Cart is empty</p>
        <p className="text-gray-400 text-sm mt-2">
          Scan or enter SKU to add products
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Cart Items</h3>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {items.map((item) => {
          const lineTotal = item.qty * item.price
          return (
            <div key={item.productId} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </h4>
                    <button
                      onClick={() => onRemoveItem(item.productId)}
                      className="ml-2 text-gray-400 hover:text-red-600"
                      title="Remove item"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatCurrency(item.price)} × {item.qty} ={' '}
                    <span className="font-semibold">
                      {formatCurrency(lineTotal)}
                    </span>
                  </p>
                  {item.stock < 10 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Low stock: {item.stock} remaining
                    </p>
                  )}
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <button
                    onClick={() => onUpdateQty(item.productId, item.qty - 1)}
                    className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    disabled={item.qty <= 1}
                  >
                    <MinusIcon className="h-5 w-5" />
                  </button>
                  <span className="w-12 text-center text-sm font-medium text-gray-900">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.productId, item.qty + 1)}
                    className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    disabled={item.qty >= item.stock}
                    title={item.qty >= item.stock ? 'Insufficient stock' : ''}
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

