'use client'

import { useState } from 'react'
import Image from 'next/image'
import { parseImages } from '@/lib/utils'
import { formatCurrency } from '@/lib/money'
import { useWishlist } from '@/hooks/useWishlist'

interface Product {
  id: number
  title: string
  description: string | null
  price: number
  stock: number
  images: string[]
}

interface ProductCardProps {
  product: Product
  storeSlug: string
}

export default function ProductCard({ product, storeSlug }: ProductCardProps) {
  const [qty, setQty] = useState(1)
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [wishlistLoading, setWishlistLoading] = useState(false)

  const addToCart = () => {
    if (qty <= 0 || product.stock === 0) return

    const cartKey = `cart-${storeSlug}`
    const existingCart = localStorage.getItem(cartKey)
    const cartItems = existingCart ? JSON.parse(existingCart) : []

    const existingItem = cartItems.find((item: any) => item.id === product.id)
    
    if (existingItem) {
      existingItem.qty += qty
    } else {
      cartItems.push({
        id: product.id,
        title: product.title,
        price: product.price,
        stock: product.stock,
        images: images,
        qty: qty,
      })
    }

    localStorage.setItem(cartKey, JSON.stringify(cartItems))
    alert('Added to cart!')
  }

  const handleWishlistToggle = async () => {
    setWishlistLoading(true)
    try {
      const result = await toggleWishlist(product.id)
      if (result.success) {
        // Success feedback could be added here
      } else {
        alert(result.error || 'Failed to update wishlist')
      }
    } catch (error) {
      alert('Failed to update wishlist')
    } finally {
      setWishlistLoading(false)
    }
  }

  const images = product.images || []
  
  // Validate and get the first valid image URL
  const getFirstValidImage = () => {
    for (const imageUrl of images) {
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
        // Check if it's a valid URL or relative path
        try {
          // If it's a relative path (starts with /), it's valid
          if (imageUrl.startsWith('/')) {
            return imageUrl
          }
          // If it's a full URL, validate it
          new URL(imageUrl)
          return imageUrl
        } catch (error) {
          // Invalid URL, try next image
          continue
        }
      }
    }
    return null
  }

  const firstValidImage = getFirstValidImage()

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-gray-100 rounded-t-lg">
        {firstValidImage ? (
          <Image
            src={firstValidImage}
            alt={product.title}
            fill
            className="object-cover rounded-t-lg"
            onError={(e) => {
              // Hide the image if it fails to load
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
        
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
            isInWishlist(product.id)
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
          } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
          title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlistLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </button>
        
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
            {formatCurrency(product.price)}
          </span>
          <span className="text-sm text-gray-500">
            Stock: {product.stock}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 mb-3">
          <label className="text-sm text-gray-600">Qty:</label>
          <input
            type="number"
            min="1"
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
            disabled={product.stock === 0}
          />
        </div>
        
        <button
          onClick={addToCart}
          disabled={product.stock === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
