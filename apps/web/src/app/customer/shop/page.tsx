'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { 
  ShoppingBagIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  BuildingStorefrontIcon,
  TagIcon,
  CurrencyRupeeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MinusIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import Pagination from '@/components/Pagination'

interface Product {
  id: number
  title: string
  description: string | null
  sku: string | null
  pricePaise: number
  stock: number
  imageUrl: string | null
  category: {
    id: number
    name: string
    imageUrl: string | null
  }
  store: {
    id: number
    name: string
    slug: string
  }
}

interface Store {
  id: number
  name: string
  slug: string
  whatsapp: string | null
  upiId: string | null
  currency: string
}

interface Category {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  productCount: number
}

export default function CustomerShopPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addItem, updateQty, removeItem, items } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [wishlistLoading, setWishlistLoading] = useState<Set<number>>(new Set())
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })

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

    fetchStoreAndProducts()
  }, [session, status, router])

  // Auto-fetch when filters change
  useEffect(() => {
    if (store) {
      fetchStoreAndProducts()
    }
  }, [selectedCategory, sort, currentPage])

  const fetchStoreAndProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      // First, get the customer's assigned store
      const userResponse = await fetch('/api/auth/profile')
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user information')
      }
      
      const userData = await userResponse.json()
      if (!userData.store) {
        setError('No store assigned. Please contact your store owner.')
        setLoading(false)
        return
      }

      setStore(userData.store)

      // Fetch products from the assigned store
      const params = new URLSearchParams()
      params.append('storeId', userData.store.id.toString())
      params.append('page', currentPage.toString())
      params.append('limit', '12')
      if (search) params.append('search', search)
      if (selectedCategory) params.append('categoryId', selectedCategory)
      if (sort) params.append('sort', sort)

      const productsResponse = await fetch(`/api/products?${params.toString()}`)
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData.products || [])
        if (productsData.pagination) {
          setPagination(productsData.pagination)
        }
      }

      // Fetch categories from the assigned store
      const categoriesResponse = await fetch(`/api/stores/${userData.store.slug}/categories`)
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.categories || [])
      }

    } catch (error) {
      console.error('Error fetching store and products:', error)
      setError('Failed to load store information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchStoreAndProducts()
  }

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      productId: product.id,
      title: product.title,
      pricePaise: product.pricePaise,
      imageUrl: product.imageUrl,
      store: product.store
    })
  }

  const handleClearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSort('newest')
    setCurrentPage(1)
    fetchStoreAndProducts()
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Get quantity of product in cart
  const getCartQuantity = (productId: number) => {
    const cartItem = items.find(item => item.productId === productId)
    return cartItem ? cartItem.qty : 0
  }

  // Handle quantity increase
  const handleIncreaseQty = (product: Product) => {
    const currentQty = getCartQuantity(product.id)
    if (currentQty === 0) {
      // Add to cart for the first time
      handleAddToCart(product)
    } else {
      // Increase quantity
      updateQty(product.id, currentQty + 1)
    }
  }

  // Handle quantity decrease
  const handleDecreaseQty = (productId: number) => {
    const currentQty = getCartQuantity(productId)
    if (currentQty > 1) {
      updateQty(productId, currentQty - 1)
    } else if (currentQty === 1) {
      removeItem(productId)
    }
  }

  // Handle wishlist toggle
  const handleWishlistToggle = async (productId: number) => {
    setWishlistLoading(prev => new Set(prev).add(productId))
    try {
      const result = await toggleWishlist(productId)
      if (result.success) {
        // Success feedback could be added here
      } else {
        alert(result.error || 'Failed to update wishlist')
      }
    } catch (error) {
      alert('Failed to update wishlist')
    } finally {
      setWishlistLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Store Access Error</h3>
              <p className="mt-1 text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ShoppingBagIcon className="h-8 w-8 mr-3 text-blue-600" />
              Shop Products
            </h1>
            <p className="mt-2 text-gray-600">
              {store ? `Browse products from ${store.name}` : 'Browse and shop from available products'}
            </p>
            {store && (
              <div className="mt-3 flex items-center text-sm text-gray-500">
                <BuildingStorefrontIcon className="h-4 w-4 mr-2" />
                <span>Assigned Store: {store.name}</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2 text-gray-500" />
              Filters
            </h3>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>

            {/* Categories */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !selectedCategory 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Categories ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id.toString())}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat.id.toString()
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat.name} ({cat.productCount})
                  </button>
                ))}
              </div>
            </div>

            {/* Store Information */}
            {store && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Pricing Information</p>
                    <p className="mt-1">Product prices are not displayed. Contact your store for pricing details.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sort */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="name">Name A-Z</option>
                <option value="category">Category</option>
                <option value="stock">Stock Available</option>
              </select>
            </div>

            {/* Apply Filters */}
            <div className="space-y-2">
              <button 
                onClick={fetchStoreAndProducts}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Apply Filters
              </button>
              <button 
                onClick={handleClearFilters}
                className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Product Image */}
                  <div className="aspect-w-16 aspect-h-12 bg-gray-100">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        width={400}
                        height={300}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <ShoppingBagIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {product.category.name}
                      </span>
                      <div className="flex items-center">
                        <StarIconSolid className="h-4 w-4 text-yellow-400" />
                        <span className="text-xs text-gray-500 ml-1">4.5</span>
                      </div>
                    </div>

                    {/* Product Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>

                    {/* Product Description */}
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Store Info */}
                    <div className="flex items-center text-xs text-gray-500 mb-3">
                      <BuildingStorefrontIcon className="h-3 w-3 mr-1" />
                      {product.store.name}
                    </div>

                    {/* Stock and Contact Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-500">
                        {product.stock > 0 ? (
                          <span className="text-green-600 font-medium">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">Out of Stock</span>
                        )}
                      </div>
                      <div className="text-sm text-blue-600">
                        <span className="font-medium">Contact for Price</span>
                      </div>
                    </div>

                    {/* Contact Information */}
                    {store && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center text-sm text-gray-600">
                          <BuildingStorefrontIcon className="h-4 w-4 mr-2" />
                          <span className="font-medium">{store.name}</span>
                        </div>
                        {store.whatsapp && (
                          <div className="mt-2 text-xs text-gray-500">
                            WhatsApp: {store.whatsapp}
                          </div>
                        )}
                        {store.upiId && (
                          <div className="text-xs text-gray-500">
                            UPI: {store.upiId}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {getCartQuantity(product.id) === 0 ? (
                        // Show Add to Cart button when not in cart
                        <button 
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                          <ShoppingCartIcon className="h-4 w-4 mr-2" />
                          Add to Cart
                        </button>
                      ) : (
                        // Show quantity controls when in cart
                        <div className="flex-1 flex items-center justify-center space-x-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                          <button
                            onClick={() => handleDecreaseQty(product.id)}
                            className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="text-lg font-semibold text-blue-900 min-w-[2rem] text-center">
                            {getCartQuantity(product.id)}
                          </span>
                          <button
                            onClick={() => handleIncreaseQty(product)}
                            disabled={getCartQuantity(product.id) >= product.stock}
                            className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <button 
                        onClick={() => handleWishlistToggle(product.id)}
                        disabled={wishlistLoading.has(product.id)}
                        className={`px-3 py-2 border rounded-lg transition-colors ${
                          isInWishlist(product.id)
                            ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        } ${wishlistLoading.has(product.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        {wishlistLoading.has(product.id) ? (
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : isInWishlist(product.id) ? (
                          <HeartIconSolid className="h-4 w-4" />
                        ) : (
                          <HeartIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price Contact Notice */}
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center text-xs text-yellow-800">
                        <InformationCircleIcon className="h-4 w-4 mr-1" />
                        <span>Contact store for pricing and availability</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}