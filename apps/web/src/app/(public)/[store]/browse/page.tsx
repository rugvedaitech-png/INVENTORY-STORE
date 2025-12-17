'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { parseImages } from '@/lib/utils'
import Pagination from '@/components/Pagination'

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

interface BrowsePageProps {
  params: Promise<{
    store: string
  }>
}

interface CartEntry {
  qty: number
  product: {
    id: number
    title: string
    price: number
    stock: number
    images: string[]
  }
}

export default function BrowsePage({ params }: BrowsePageProps) {
  const { store: storeSlug } = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cartItems, setCartItems] = useState<Record<number, CartEntry>>({})
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })

  // Load store data
  useEffect(() => {
    if (!storeSlug) return

    const loadStore = async () => {
      try {
        const response = await fetch(`/api/stores/${storeSlug}?page=${currentPage}&limit=12`)
        if (response.ok) {
          const storeData = await response.json()
          setStore(storeData)
          setPagination(storeData.pagination)
        }
      } catch (error) {
        console.error('Error loading store:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStore()
  }, [storeSlug, currentPage])

  // Load cart from localStorage on component mount
  useEffect(() => {
    if (!storeSlug) return
    const savedCart = localStorage.getItem(`cart-${storeSlug}`)
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart)
        const cartMap: Record<number, CartEntry> = {}
        cart.forEach((item: { id: number; qty: number; product?: CartEntry['product'] }) => {
          if (item.product) {
            cartMap[item.id] = {
              qty: item.qty,
              product: item.product
            }
          }
        })
        setCartItems(cartMap)
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
  }, [storeSlug])

  // Filter products when category changes
  useEffect(() => {
    if (selectedCategory && store) {
      const filtered = store.products.filter(product =>
        product.categoryId === selectedCategory.id
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts([])
    }
  }, [selectedCategory, store])

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
  }

  const updateCart = (productId: number, qty: number) => {
    const newCartItems = { ...cartItems }
    if (qty <= 0) {
      delete newCartItems[productId]
    } else {
      // Find the product data to store with cart item
      const product = store?.products.find(p => p.id === productId)
      if (product) {
        newCartItems[productId] = {
          qty,
          product: {
            id: product.id,
            title: product.title,
            price: product.price,
            stock: product.stock,
            images: parseImages(product.images)
          }
        }
      }
    }
    setCartItems(newCartItems)

    // Save to localStorage
    const cartArray = Object.entries(newCartItems).map(([id, item]) => ({
      id: parseInt(id),
      qty: item.qty,
      product: item.product
    }))
    localStorage.setItem(`cart-${storeSlug}`, JSON.stringify(cartArray))
  }

  const getCartItemCount = () => {
    return Object.values(cartItems).reduce((total, item) => total + (item.qty || 0), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Store not found</h1>
          <p className="text-gray-600">The store you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
                {store.whatsapp && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{store.whatsapp}</span>
                  </div>
                )}
              </div>
            </div>
            <Link
              href={`/${storeSlug}/cart`}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl relative group"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18m-7.5 0L7 13m0 0l2.5-5" />
                </svg>
                <span className="font-semibold">View Cart</span>
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
                    {getCartItemCount()}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {store.categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              No categories available
            </h2>
            <p className="text-gray-600 text-lg">
              This store doesn&apos;t have any categories yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {!selectedCategory ? (
              /* Categories View */
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Select a Category</h2>
                  <p className="text-gray-600">Choose from our wide range of products</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {store.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 text-left transform hover:-translate-y-1"
                    >
                      <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            width={200}
                            height={96}
                            className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                          {category.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {category._count.products} products
                          </p>
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Products View */
              <div>
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleBackToCategories}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Categories
                      </button>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {selectedCategory.name}
                        </h2>
                        <p className="text-gray-600">{filteredProducts.length} products available</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      No products in this category
                    </h3>
                    <p className="text-gray-600 text-lg">
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

            {/* Pagination */}
            {pagination.pages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
              />
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
  cartItems: Record<number, any>
  onUpdateCart: (productId: number, qty: number) => void
}

function ProductCardWithCart({ product, cartItems, onUpdateCart }: ProductCardWithCartProps) {
  const currentQty = cartItems[product.id]?.qty || 0

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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="aspect-square relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-2xl overflow-hidden">
        {product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
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
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-red-500 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-700">{product.stock}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 mb-2 text-lg">{product.title}</h3>
        {product.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-gray-900">
            ₹{(product.price / 100).toFixed(2)}
          </span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500 font-medium">In Stock</span>
          </div>
        </div>

        {/* Cart Controls */}
        <div className="flex items-center justify-center space-x-3">
          {currentQty > 0 ? (
            <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-2">
              <button
                onClick={handleRemoveFromCart}
                disabled={product.stock === 0}
                className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-gray-900">{currentQty}</span>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || currentQty >= product.stock}
                className="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
