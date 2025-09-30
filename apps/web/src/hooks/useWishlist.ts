import { useState, useEffect, useCallback } from 'react'

export interface WishlistItem {
  id: number
  productId: number
  createdAt: string
  product: {
    id: number
    title: string
    price: number
    images: string
    description: string | null
    stock: number
    store: {
      id: number
      name: string
      slug: string
      whatsapp: string | null
      upiId: string | null
    }
    category: {
      id: number
      name: string
    } | null
  }
}

export interface WishlistPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface WishlistResponse {
  wishlist: WishlistItem[]
  pagination: WishlistPagination
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [pagination, setPagination] = useState<WishlistPagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWishlist = useCallback(async (page = 1, limit = 20) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/wishlist?page=${page}&limit=${limit}`)
      if (response.ok) {
        const data: WishlistResponse = await response.json()
        setWishlist(data.wishlist)
        setPagination(data.pagination)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch wishlist')
        setWishlist([])
        setPagination(null)
      }
    } catch (err) {
      setError('Network error')
      setWishlist([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const addToWishlist = useCallback(async (productId: number) => {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })

      if (response.ok) {
        const newItem: WishlistItem = await response.json()
        setWishlist(prev => [newItem, ...prev])
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }, [])

  const removeFromWishlist = useCallback(async (productId: number) => {
    try {
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setWishlist(prev => prev.filter(item => item.productId !== productId))
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }, [])

  const isInWishlist = useCallback((productId: number) => {
    return wishlist.some(item => item.productId === productId)
  }, [wishlist])

  const toggleWishlist = useCallback(async (productId: number) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId)
    } else {
      return await addToWishlist(productId)
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist])

  const clearWishlist = useCallback(() => {
    setWishlist([])
    setPagination(null)
    setError(null)
  }, [])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  return {
    wishlist,
    pagination,
    loading,
    error,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
  }
}
