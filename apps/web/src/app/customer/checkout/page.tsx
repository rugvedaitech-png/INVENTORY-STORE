'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { 
  ShoppingCartIcon, 
  MapPinIcon, 
  CreditCardIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'


interface Store {
  id: number
  name: string
  slug: string
  whatsapp: string | null
  upiId: string | null
  currency: string
}

interface CustomerAddress {
  id: number
  title: string
  fullName: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  isActive: boolean
}

export default function CustomerCheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, clearCart } = useCart()
  
  const [store, setStore] = useState<Store | null>(null)
  const [activeAddress, setActiveAddress] = useState<CustomerAddress | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod] = useState('COD' as const)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      router.push('/auth/login')
      return
    }

    if (session.user.role !== 'CUSTOMER') {
      router.push('/unauthorized')
      return
    }

    if (items.length === 0) {
      router.push('/customer/shop')
      return
    }

    fetchStoreAndAddress()
  }, [session, status, router, items])

  const fetchStoreAndAddress = async () => {
    try {
      setLoading(true)
      
      // Fetch store info
      const storeResponse = await fetch('/api/auth/profile')
      if (storeResponse.ok) {
        const userData = await storeResponse.json()
        if (userData.store) {
          setStore(userData.store)
        }
      }

      // Fetch active address
      const addressResponse = await fetch('/api/addresses')
      if (addressResponse.ok) {
        const addressData = await addressResponse.json()
        const activeAddr = addressData.addresses?.find((addr: CustomerAddress) => addr.isActive)
        setActiveAddress(activeAddr || null)
      }

    } catch (error) {
      console.error('Error fetching checkout data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!activeAddress) {
      newErrors.address = 'No active address found. Please add an address first.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!store) {
      setErrors({ general: 'Store information not available' })
      return
    }

    if (!activeAddress) {
      setErrors({ general: 'No active address found' })
      return
    }

    try {
      setSubmitting(true)
      
      const orderData = {
        storeId: store.id,
        addressId: activeAddress.id,
        buyerName: activeAddress.fullName, // Use address full name
        phone: activeAddress.phone, // Use address phone
        address: `${activeAddress.address}, ${activeAddress.city}, ${activeAddress.state} - ${activeAddress.pincode}`, // Backward compatibility
        paymentMethod: paymentMethod,
        items: items.map(item => ({
          productId: item.productId.toString(),
          qty: item.qty,
        }))
      }

      const response = await fetch(`/api/orders?store=${store.slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const order = await response.json()
        clearCart()
        router.push(`/success?orderId=${order.id}&store=${store.slug}`)
      } else {
        const errorData = await response.json()
        setErrors({ general: errorData.error || 'Failed to place order' })
      }
    } catch (error) {
      console.error('Error placing order:', error)
      setErrors({ general: 'Failed to place order. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Store Access Error</h3>
              <p className="mt-1 text-red-600">Unable to load store information. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Order Summary */}
        <div className="lg:order-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Order Summary
            </h2>

            {/* Cart Items */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={60}
                        height={60}
                        className="w-12 h-12 sm:w-15 sm:h-15 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-15 sm:h-15 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {item.store.name}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-blue-600 mt-1">
                      Contact for Price
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                    Qty: {item.qty}
                  </div>
                </div>
              ))}
            </div>

            {/* Store Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Store Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium">Store:</span>
                  <span className="ml-2">{store.name}</span>
                </div>
                {store.whatsapp && (
                  <div className="flex items-center">
                    <span className="font-medium">WhatsApp:</span>
                    <span className="ml-2">{store.whatsapp}</span>
                  </div>
                )}
                {store.upiId && (
                  <div className="flex items-center">
                    <span className="font-medium">UPI ID:</span>
                    <span className="ml-2">{store.upiId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Notice */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Pricing Information</p>
                  <p className="mt-1">
                    Product prices are not displayed. The store owner will calculate the final price 
                    and contact you for payment confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="lg:order-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Delivery Information</h2>

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Active Address Display */}
              {activeAddress ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-green-800 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Delivery Address ({activeAddress.title})
                    </h3>
                    <button
                      onClick={() => router.push('/customer/addresses')}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Change Address
                    </button>
                  </div>
                  <div className="text-sm text-gray-900">
                    <div className="font-medium">{activeAddress.fullName}</div>
                    <div className="text-gray-600">{activeAddress.phone}</div>
                    <div className="text-gray-600 mt-1">
                      {activeAddress.address}<br />
                      {activeAddress.city}, {activeAddress.state} - {activeAddress.pincode}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">No Active Address</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Please add a delivery address to continue with checkout.
                      </p>
                      <button
                        onClick={() => router.push('/customer/addresses')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Add Address Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {errors.address && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{errors.address}</p>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCardIcon className="h-4 w-4 inline mr-1" />
                  Payment Method
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <span className="text-gray-900 font-medium">Cash on Delivery (COD)</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Payment will be collected upon delivery. Pricing will be calculated at the time of delivery.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
