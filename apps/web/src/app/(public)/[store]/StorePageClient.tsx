'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { parseImages } from '@/lib/utils'
import { formatCurrency, decimalToNumber } from '@/lib/money'

interface Category {
  id: number
  name: string
  description: string | null
  image: string | null
  slug: string
  active: boolean
  sortOrder: number
  _count: {
    products: number
  }
}

interface Product {
  id: number
  title: string
  description: string | null
  price: number
  stock: number
  images: string
  active: boolean
  categoryId: number | null
  category: Category | null
}

interface Store {
  id: number
  name: string
  whatsapp: string | null
  upiId: string | null
  currency: string
  products: Product[]
  categories: Category[]
}

interface StorePageClientProps {
  store: Store
  storeSlug: string
}

export default function StorePageClient({ store, storeSlug }: StorePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cartItems, setCartItems] = useState<Record<number, number>>({})

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart-${storeSlug}`)
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart)
        const cartMap: Record<number, number> = {}
        cart.forEach((item: { id: number; qty: number }) => {
          cartMap[item.id] = item.qty
        })
        setCartItems(cartMap)
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
  }, [storeSlug])

  // Filter products when category changes
  useEffect(() => {
    if (selectedCategory) {
      const filtered = store.products.filter(product =>
        product.categoryId === selectedCategory.id
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts([])
    }
  }, [selectedCategory, store.products])

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category)
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
  }

  const updateCart = (productId: number, qty: number) => {
    const newCartItems = { ...cartItems }
    if (qty <= 0) {
      delete newCartItems[productId]
    } else {
      newCartItems[productId] = qty
    }
    setCartItems(newCartItems)

    // Save to localStorage
    const cartArray = Object.entries(newCartItems).map(([id, qty]) => ({
      id: parseInt(id),
      qty
    }))
    localStorage.setItem(`cart-${storeSlug}`, JSON.stringify(cartArray))
  }

  const getCartItemCount = () => {
    return Object.values(cartItems).reduce((total, qty) => total + qty, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
              {store.whatsapp && (
                <p className="text-sm text-gray-600 mt-1">
                  📱 WhatsApp: {store.whatsapp}
                </p>
              )}
            </div>
            <Link
              href={`/${storeSlug}/cart`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors relative"
            >
              View Cart
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {store.categories.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No categories available
            </h2>
            <p className="text-gray-600">
              This store doesn&apos;t have any categories yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {!selectedCategory ? (
              /* Categories View */
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Select a Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {store.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow text-left"
                    >
                      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            width={200}
                            height={96}
                            className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {category.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {category._count.products} products
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Products View */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleBackToCategories}
                      className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Categories
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCategory.name}
                    </h2>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      No products in this category
                    </h3>
                    <p className="text-gray-600">
                      This category doesn&apos;t have any products yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCardWithCart
                        key={product.id}
                        product={{
                          ...product,
                          images: parseImages(product.images)
                        }}
                        cartItems={cartItems}
                        onUpdateCart={updateCart}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// Enhanced ProductCard with cart functionality
interface ProductCardWithCartProps {
  product: {
    id: number
    title: string
    description: string | null
    price: number
    stock: number
    images: string[]
    active: boolean
  }
  cartItems: Record<number, number>
  onUpdateCart: (productId: number, qty: number) => void
}

function ProductCardWithCart({ product, cartItems, onUpdateCart }: ProductCardWithCartProps) {
  const currentQty = cartItems[product.id] || 0

  const handleAddToCart = () => {
    if (currentQty < product.stock) {
      onUpdateCart(product.id, currentQty + 1)
    }
  }

  const handleRemoveFromCart = () => {
    if (currentQty > 0) {
      onUpdateCart(product.id, currentQty - 1)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-gray-100 rounded-t-lg">
        {product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover rounded-t-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(decimalToNumber(product.price))}
          </span>
          <span className="text-sm text-gray-500">
            Stock: {product.stock}
          </span>
        </div>

        {/* Cart Controls */}
        <div className="flex items-center justify-center space-x-2">
          {currentQty > 0 ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRemoveFromCart}
                disabled={product.stock === 0}
                className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                -
              </button>
              <span className="w-8 text-center font-medium">{currentQty}</span>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || currentQty >= product.stock}
                className="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
