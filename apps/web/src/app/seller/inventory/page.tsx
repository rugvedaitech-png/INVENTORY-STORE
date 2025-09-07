'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/money'

interface Product {
  id: string
  title: string
  sku: string | null
  stock: number
  reorderPoint: number
  reorderQty: number
  costPrice: number | null
  supplier: {
    id: string
    name: string
    leadTimeDays: number
  } | null
}

interface ReorderSuggestion {
  productId: string
  title: string
  sku: string | null
  currentStock: number
  reorderPoint: number
  reorderQty: number
  proposedQty: number
  supplier: {
    id: string
    name: string
    leadTimeDays: number
  } | null
  daysOfCover: number
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inventory' | 'reorder'>('inventory')

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const fetchInventoryData = async () => {
    try {
      // In a real app, you'd fetch from your API
      // For now, we'll use mock data
      const mockProducts: Product[] = [
        {
          id: '1',
          title: 'Classic Cotton T-Shirt',
          sku: 'TSH-001',
          stock: 20,
          reorderPoint: 5,
          reorderQty: 25,
          costPrice: 300,
          supplier: {
            id: '1',
            name: 'Fashion Wholesale Co.',
            leadTimeDays: 3,
          },
        },
        {
          id: '2',
          title: 'Denim Jeans',
          sku: 'JNS-001',
          stock: 15,
          reorderPoint: 3,
          reorderQty: 20,
          costPrice: 800,
          supplier: {
            id: '1',
            name: 'Fashion Wholesale Co.',
            leadTimeDays: 3,
          },
        },
        {
          id: '3',
          title: 'Summer Dress',
          sku: 'DRS-001',
          stock: 2, // Low stock
          reorderPoint: 4,
          reorderQty: 15,
          costPrice: 500,
          supplier: null,
        },
      ]

      const mockReorderSuggestions: ReorderSuggestion[] = [
        {
          productId: '3',
          title: 'Summer Dress',
          sku: 'DRS-001',
          currentStock: 2,
          reorderPoint: 4,
          reorderQty: 15,
          proposedQty: 17, // reorderPoint - currentStock + reorderQty
          supplier: null,
          daysOfCover: 0.5, // stock / reorderQty
        },
      ]

      setProducts(mockProducts)
      setReorderSuggestions(mockReorderSuggestions)
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (stock: number, reorderPoint: number) => {
    if (stock === 0) return { color: 'text-red-600', bg: 'bg-red-100', text: 'Out of Stock' }
    if (stock <= reorderPoint) return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Low Stock' }
    return { color: 'text-green-600', bg: 'bg-green-100', text: 'In Stock' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track stock levels and manage reorder suggestions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stock Overview
            </button>
            <button
              onClick={() => setActiveTab('reorder')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reorder'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reorder Suggestions
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'inventory' && (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Product
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    SKU
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Current Stock
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Reorder Point
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Cost Price
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Days of Cover
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {products.map((product) => {
                  const status = getStockStatus(product.stock, product.reorderPoint)
                  const daysOfCover = product.stock / Math.max(product.reorderQty || 1, 1)
                  
                  return (
                    <tr key={product.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {product.title}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {product.sku || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {product.stock}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {product.reorderPoint}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {product.costPrice ? formatCurrency(product.costPrice) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {daysOfCover.toFixed(1)} days
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reorder' && (
          <div>
            {reorderSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">All good!</h3>
                <p className="mt-1 text-sm text-gray-500">No products need reordering at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reorderSuggestions.map((suggestion) => (
                  <div key={suggestion.productId} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{suggestion.title}</h3>
                        <p className="text-sm text-gray-500">SKU: {suggestion.sku || 'N/A'}</p>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Current Stock:</span>
                            <span className="ml-2 font-medium text-red-600">{suggestion.currentStock}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Reorder Point:</span>
                            <span className="ml-2 font-medium">{suggestion.reorderPoint}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Proposed Qty:</span>
                            <span className="ml-2 font-medium text-blue-600">{suggestion.proposedQty}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Days of Cover:</span>
                            <span className="ml-2 font-medium">{suggestion.daysOfCover.toFixed(1)} days</span>
                          </div>
                        </div>
                        {suggestion.supplier && (
                          <div className="mt-2 text-sm text-gray-500">
                            Supplier: {suggestion.supplier.name} (Lead time: {suggestion.supplier.leadTimeDays} days)
                          </div>
                        )}
                      </div>
                      <div className="ml-6">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Create Purchase Order
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

