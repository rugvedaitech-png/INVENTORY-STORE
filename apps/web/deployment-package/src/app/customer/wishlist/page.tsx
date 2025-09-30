'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useWishlist, WishlistItem } from '@/hooks/useWishlist'
import { formatCurrency } from '@/lib/money'
import { HeartIcon, PlusIcon, ShoppingCartIcon, TrashIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useCart } from '@/hooks/useCart'

export default function CustomerWishlistPage() {
  const { wishlist, loading, error, removeFromWishlist, toggleWishlist } = useWishlist()
  const { addItem: addToCart } = useCart()
  const [removingItems, setRemovingItems] = useState<Set<number>>(new Set())
  const [addingToCart, setAddingToCart] = useState<Set<number>>(new Set())

  const handleRemoveFromWishlist = async (productId: number) => {
    setRemovingItems(prev => new Set(prev).add(productId))
    try {
      await removeFromWishlist(productId)
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleReorder = async (item: WishlistItem) => {
    setAddingToCart(prev => new Set(prev).add(item.productId))
    try {
      // Add to cart using the useCart hook
      addToCart({
        id: item.product.id,
        productId: item.product.id,
        title: item.product.title,
        pricePaise: item.product.price,
        imageUrl: item.product.images ? JSON.parse(item.product.images)[0] : null,
        store: {
          id: item.product.store.id,
          name: item.product.store.name,
          slug: item.product.store.slug
        }
      })
      alert('Added to cart!')
    } catch (error) {
      alert('Failed to add to cart')
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.productId)
        return newSet
      })
    }
  }

  const handleReorderAll = async () => {
    const availableItems = wishlist.filter(item => item.product.stock > 0)
    
    if (availableItems.length === 0) {
      alert('No items available for reorder')
      return
    }

    try {
      let successCount = 0
      for (const item of availableItems) {
        try {
          addToCart({
            id: item.product.id,
            productId: item.product.id,
            title: item.product.title,
            pricePaise: item.product.price,
            imageUrl: item.product.images ? JSON.parse(item.product.images)[0] : null,
            store: {
              id: item.product.store.id,
              name: item.product.store.name,
              slug: item.product.store.slug
            }
          })
          successCount++
        } catch (error) {
          console.error('Error adding item to cart:', error)
        }
      }
      
      if (successCount > 0) {
        alert(`${successCount} item(s) added to cart!`)
      } else {
        alert('Failed to add items to cart')
      }
    } catch (error) {
      alert('Error adding items to cart')
    }
  }

  const getFirstValidImage = (images: string) => {
    try {
      const imageArray = JSON.parse(images)
      for (const imageUrl of imageArray) {
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
          if (imageUrl.startsWith('/')) {
            return imageUrl
          }
          try {
            new URL(imageUrl)
            return imageUrl
          } catch (error) {
            continue
          }
        }
      }
    } catch (error) {
      // Invalid JSON, try as single string
      if (images && typeof images === 'string' && images.trim()) {
        if (images.startsWith('/')) {
          return images
        }
        try {
          new URL(images)
          return images
        } catch (error) {
          return null
        }
      }
    }
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <HeartIcon className="h-8 w-8 mr-3 text-red-600" />
            My Wishlist
          </h1>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error loading wishlist: {error}</div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Try Again
            </button>
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
              <HeartIcon className="h-8 w-8 mr-3 text-red-600" />
              My Wishlist
            </h1>
            <p className="mt-2 text-gray-600">
              {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          {wishlist.length > 0 && (
            <button
              onClick={handleReorderAll}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2" />
              Reorder All
            </button>
          )}
        </div>
      </div>

      {wishlist.length === 0 ? (
        /* Empty State */
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <div className="text-center py-12">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items in wishlist</h3>
            <p className="mt-1 text-sm text-gray-500">Start adding items you love to your wishlist.</p>
            <div className="mt-6">
              <a
                href="/customer/shop"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Start Shopping
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Wishlist Items */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const firstImage = getFirstValidImage(item.product.images)
            const isOutOfStock = item.product.stock === 0
            const isRemoving = removingItems.has(item.productId)
            const isAddingToCart = addingToCart.has(item.productId)

            return (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="aspect-square relative bg-gray-100 rounded-t-lg">
                  {firstImage ? (
                    <Image
                      src={firstImage}
                      alt={item.product.title}
                      fill
                      className="object-cover rounded-t-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-semibold">Out of Stock</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.product.title}</h3>
                    <button
                      onClick={() => handleRemoveFromWishlist(item.productId)}
                      disabled={isRemoving}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove from wishlist"
                    >
                      {isRemoving ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  {item.product.category && (
                    <p className="text-xs text-gray-500 mb-2">{item.product.category.name}</p>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(item.product.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {item.product.stock}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {item.product.store.name}
                    </span>
                    <button
                      onClick={() => handleReorder(item)}
                      disabled={isOutOfStock || isAddingToCart}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAddingToCart ? (
                        <>
                          <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCartIcon className="w-3 h-3 mr-1" />
                          {isOutOfStock ? 'Out of Stock' : 'Reorder'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
