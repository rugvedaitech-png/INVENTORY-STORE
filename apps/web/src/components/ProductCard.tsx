'use client'

import { useState } from 'react'
import Image from 'next/image'
import { parseImages } from '@/lib/utils'
import { formatCurrency } from '@/lib/money'

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

  const addToCart = () => {
    if (qty <= 0 || product.stock === 0) return

    const cartKey = `cart-${storeSlug}`
    const existingCart = localStorage.getItem(cartKey)
    const cartItems = existingCart ? JSON.parse(existingCart) : []

    const existingItem = cartItems.find((item: any) => item.id === product.id)
    
    if (existingItem) {
      existingItem.qty += qty
    } else {
      const images = product.images
      cartItems.push({
        id: product.id,
        title: product.title,
        price: product.price,
        stock: product.stock,
        images: product.images,
        qty: qty,
      })
    }

    localStorage.setItem(cartKey, JSON.stringify(cartItems))
    alert('Added to cart!')
  }

  const images = product.images

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-gray-100 rounded-t-lg">
        {images.length > 0 ? (
          <Image
            src={images[0]}
            alt={product.title}
            fill
            className="object-cover rounded-t-lg"
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
