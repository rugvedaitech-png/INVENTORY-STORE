'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface CartItem {
  id: number
  productId: number
  title: string
  pricePaise: number
  imageUrl: string | null
  store: {
    id: number
    name: string
    slug: string
  }
  qty: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'>) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('customer-cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('customer-cart', JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<CartItem, 'qty'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(i => i.productId === item.productId)
      if (existingItem) {
        return prevItems.map(i =>
          i.productId === item.productId
            ? { ...i, qty: i.qty + 1 }
            : i
        )
      }
      return [...prevItems, { ...item, qty: 1 }]
    })
  }

  const removeItem = (productId: number) => {
    setItems(prevItems => prevItems.filter(i => i.productId !== productId))
  }

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeItem(productId)
      return
    }
    setItems(prevItems =>
      prevItems.map(i =>
        i.productId === productId ? { ...i, qty } : i
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.qty, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.pricePaise * item.qty), 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}