'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/money'
import Image from 'next/image'
import Link from 'next/link'

interface CartItem {
  id: number
  title?: string
  price?: number
  stock?: number
  images?: string[]
  qty: number
  product?: {
    id: number
    title: string
    price: number
    stock: number
    images: string[]
  }
}

interface CartPageProps {
  params: Promise<{
    store: string
  }>
}

export default function CartPage({ params }: CartPageProps) {
  const { store: storeSlug } = use(params)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Load cart from localStorage
    if (!storeSlug) return
    const savedCart = localStorage.getItem(`cart-${storeSlug}`)
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart)
        // Cart now contains product data directly
        setCartItems(cart)
      } catch (error) {
        console.error('Error loading cart:', error)
        setCartItems([])
      }
    }
    setLoading(false)
  }, [storeSlug])

  const updateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(productId)
      return
    }

    const updatedItems = cartItems.map(item =>
      item.id === productId ? { ...item, qty: newQty } : item
    )
    setCartItems(updatedItems)
    localStorage.setItem(`cart-${storeSlug}`, JSON.stringify(updatedItems))
  }

  const removeItem = (productId: number) => {
    const updatedItems = cartItems.filter(item => item.id !== productId)
    setCartItems(updatedItems)
    localStorage.setItem(`cart-${storeSlug}`, JSON.stringify(updatedItems))
  }

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + ((item.product?.price || 0) * item.qty), 0)
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) return
    router.push(`/${storeSlug}/checkout`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-sm text-gray-600 mt-1">
                {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
              </p>
            </div>
            <Link
              href={`/${storeSlug}`}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Add some products to get started!
            </p>
            <Link
              href={`/${storeSlug}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Cart Items
                  </h2>
                  <div className="space-y-4">
                    {cartItems.map((item) => {
                      const hasImages = (item.product?.images?.length ?? 0) > 0
                      const availableStock = item.product?.stock ?? item.stock ?? Infinity
                      return (
                        <div
                          key={item.id}
                          className="flex items-center space-x-4 p-4 border rounded-lg"
                        >
                          <div className="w-20 h-20 relative bg-gray-100 rounded-lg flex-shrink-0">
                            {hasImages ? (
                              <Image
                                src={item.product!.images![0]!}
                                alt={item.product!.title}
                                fill
                                className="object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400">
                                <svg
                                  className="w-8 h-8"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {item.product?.title || item.title || 'Unknown Product'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {item.product?.price ? formatCurrency(item.product.price) : item.price ? formatCurrency(item.price) : '₹0.00'} each
                          </p>
                          <p className="text-xs text-gray-500">
                            Stock: {availableStock === Infinity ? '—' : availableStock}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.qty - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.qty + 1)}
                            disabled={availableStock !== Infinity && item.qty >= availableStock}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(((item.product?.price ?? item.price) || 0) * item.qty)}
                          </p>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border sticky top-8">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Summary
                  </h2>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-600">
                          {item.product?.title || item.title || 'Unknown Product'} × {item.qty}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(((item.product?.price ?? item.price) || 0) * item.qty)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(getTotalAmount())}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

