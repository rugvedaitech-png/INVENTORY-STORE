'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BarcodeInput from '@/components/billing/BarcodeInput'
import BillingCart from '@/components/billing/BillingCart'
import BillingSummary from '@/components/billing/BillingSummary'
import CustomerSelector from '@/components/billing/CustomerSelector'
import { cartStorage, type CartItem } from '@/lib/cartStorage'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface Product {
  id: number
  title: string
  sku: string
  price: number
  stock: number
  description: string | null
  images: string
  category: {
    id: number
    name: string
  } | null
}

export default function BillingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [storeId, setStoreId] = useState<number | null>(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [foundProduct, setFoundProduct] = useState<Product | null>(null)
  const [productNotFound, setProductNotFound] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string; phone: string; email: string } | null>(null)
  const [customerSelected, setCustomerSelected] = useState(false) // Track if customer selection is complete

  // Fetch store ID
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
    fetchStoreId()
  }, [session, status, router])

  // Load cart from localStorage on mount
  useEffect(() => {
    if (storeId) {
      const { items } = cartStorage.loadCart()
      setCartItems(items)
    }
  }, [storeId])

  const fetchStoreId = async () => {
    try {
      const response = await fetch('/api/stores')
      if (!response.ok) throw new Error('Failed to fetch stores')
      const data = await response.json()
      const stores = data.stores || data
      if (stores && stores.length > 0) {
        const id = stores[0].id
        setStoreId(id)
        // Load cart for this store
        const { items } = cartStorage.loadCart()
        if (items.length > 0) {
          setCartItems(items)
        }
      }
    } catch (err) {
      setError('Failed to fetch store information')
    }
  }

  const lookupProduct = useCallback(async (sku: string) => {
    if (!storeId || !sku.trim()) return

    setLoading(true)
    setError(null)
    setFoundProduct(null)
    setProductNotFound(false)

    try {
      const response = await fetch('/api/products/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: sku.trim(), storeId }),
      })

      const data = await response.json()

      if (!response.ok || !data.found) {
        setProductNotFound(true)
        setBarcodeInput('')
        setTimeout(() => setProductNotFound(false), 3000)
        return
      }

      const product = data.product
      setFoundProduct(product)

      // Add to cart
      const cartItem: CartItem = {
        productId: product.id,
        sku: product.sku,
        title: product.title,
        price: product.price,
        qty: 1,
        stock: product.stock,
      }

      const updatedItems = cartStorage.addItem(storeId, cartItem)
      setCartItems(updatedItems)

      // Clear input and reset found product after a delay
      setBarcodeInput('')
      setTimeout(() => {
        setFoundProduct(null)
      }, 2000)
    } catch (err) {
      setError('Failed to lookup product')
      setProductNotFound(true)
      setTimeout(() => setProductNotFound(false), 3000)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  const handleBarcodeEnter = () => {
    if (barcodeInput.trim()) {
      lookupProduct(barcodeInput.trim())
    }
  }

  const handleUpdateQty = (productId: number, qty: number) => {
    if (!storeId) return
    const updatedItems = cartStorage.updateItemQty(storeId, productId, qty)
    setCartItems(updatedItems)
  }

  const handleRemoveItem = (productId: number) => {
    if (!storeId) return
    const updatedItems = cartStorage.removeItem(storeId, productId)
    setCartItems(updatedItems)
  }

  const handleCompleteBill = async (discount: { type: 'PERCENTAGE' | 'AMOUNT'; value: number }, taxRate: number) => {
    if (!storeId || cartItems.length === 0) return

    setProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/billing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          items: cartItems.map((item) => ({
            productId: item.productId,
            qty: item.qty,
            price: item.price,
          })),
          paymentMethod: 'COD',
          customerId: selectedCustomer?.id || null,
          discount: discount.value > 0 ? discount : null,
          taxRate: taxRate || 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create bill')
      }

      // Clear cart and customer selection
      cartStorage.clearCart()
      setCartItems([])
      setBarcodeInput('')
      setSelectedCustomer(null)
      setCustomerSelected(false) // Reset customer selection state

      // Show success and redirect with print parameter
      setSuccess(`Bill created successfully! Order #${data.orderId}`)
      setTimeout(() => {
        router.push(`/seller/billing/receipt/${data.orderId}?print=true`)
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bill')
    } finally {
      setProcessing(false)
    }
  }

  if (status === 'loading' || !storeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">POS Billing</h1>
          <p className="mt-2 text-gray-600">
            {customerSelected 
              ? 'Scan barcode or enter SKU to add products'
              : 'Select a customer to start billing'
            }
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {productNotFound && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">Product not found</p>
          </div>
        )}

        {foundProduct && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              ✓ Added: {foundProduct.title} ({foundProduct.sku})
            </p>
          </div>
        )}

        {/* Customer Selection Step - Show first */}
        {!customerSelected ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Customer Search</h2>
                <p className="text-gray-600 text-lg">Search by phone number to find or create a customer</p>
              </div>

              {/* Customer Selection - Prominent Search */}
              <div className="mb-6">
                <CustomerSelector
                  storeId={storeId}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={(customer) => {
                    setSelectedCustomer(customer)
                    if (customer) {
                      setCustomerSelected(true)
                    }
                  }}
                  disabled={processing}
                />
              </div>

              {/* Walk-in Option */}
              <div className="mt-8 pt-6 border-t-2 border-gray-300">
                <p className="text-center text-sm text-gray-600 mb-3">Or continue without a customer</p>
                <button
                  onClick={() => {
                    setSelectedCustomer(null)
                    setCustomerSelected(true)
                  }}
                  disabled={processing}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
                >
                  Continue as Walk-in Customer
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main Layout - Show after customer selection */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer Info, Barcode Input and Cart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info Display */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                    </p>
                    {selectedCustomer && (
                      <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null)
                      setCustomerSelected(false)
                      // Clear cart when changing customer
                      cartStorage.clearCart()
                      setCartItems([])
                      setBarcodeInput('')
                    }}
                    disabled={processing}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  >
                    Change Customer
                  </button>
                </div>
              </div>

              {/* Barcode Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode Scanner / SKU Input
                </label>
                <BarcodeInput
                  value={barcodeInput}
                  onChange={setBarcodeInput}
                  onEnter={handleBarcodeEnter}
                  disabled={loading || processing}
                />
                {loading && (
                  <p className="mt-2 text-sm text-gray-500">Looking up product...</p>
                )}
              </div>

              {/* Cart */}
              <BillingCart
                items={cartItems}
                onUpdateQty={handleUpdateQty}
                onRemoveItem={handleRemoveItem}
              />
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <BillingSummary
                items={cartItems}
                onCompleteBill={handleCompleteBill}
                loading={processing}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

