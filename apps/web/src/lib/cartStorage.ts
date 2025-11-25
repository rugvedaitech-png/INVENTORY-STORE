// Cart storage utility for POS Billing
// Handles localStorage operations for offline cart persistence

export interface CartItem {
  productId: number
  sku: string
  title: string
  price: number
  qty: number
  stock: number
}

const CART_STORAGE_KEY = 'pos_billing_cart'
const STORE_ID_KEY = 'pos_billing_storeId'

export const cartStorage = {
  // Save cart to localStorage
  saveCart: (storeId: number, items: CartItem[]): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      localStorage.setItem(STORE_ID_KEY, storeId.toString())
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error)
    }
  },

  // Load cart from localStorage
  loadCart: (): { storeId: number | null; items: CartItem[] } => {
    if (typeof window === 'undefined') {
      return { storeId: null, items: [] }
    }
    try {
      const itemsJson = localStorage.getItem(CART_STORAGE_KEY)
      const storeIdStr = localStorage.getItem(STORE_ID_KEY)
      const items = itemsJson ? JSON.parse(itemsJson) : []
      const storeId = storeIdStr ? parseInt(storeIdStr, 10) : null
      return { storeId, items: Array.isArray(items) ? items : [] }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error)
      return { storeId: null, items: [] }
    }
  },

  // Clear cart from localStorage
  clearCart: (): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(CART_STORAGE_KEY)
      localStorage.removeItem(STORE_ID_KEY)
    } catch (error) {
      console.error('Failed to clear cart from localStorage:', error)
    }
  },

  // Add item to cart
  addItem: (storeId: number, item: CartItem): CartItem[] => {
    const { items: currentItems } = cartStorage.loadCart()
    
    // Check if item already exists
    const existingIndex = currentItems.findIndex(
      (i) => i.productId === item.productId
    )

    let updatedItems: CartItem[]
    if (existingIndex >= 0) {
      // Increment quantity
      updatedItems = [...currentItems]
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        qty: updatedItems[existingIndex].qty + item.qty,
      }
    } else {
      // Add new item
      updatedItems = [...currentItems, item]
    }

    cartStorage.saveCart(storeId, updatedItems)
    return updatedItems
  },

  // Update item quantity
  updateItemQty: (storeId: number, productId: number, qty: number): CartItem[] => {
    const { items: currentItems } = cartStorage.loadCart()
    
    if (qty <= 0) {
      // Remove item if quantity is 0 or less
      const updatedItems = currentItems.filter((i) => i.productId !== productId)
      cartStorage.saveCart(storeId, updatedItems)
      return updatedItems
    }

    const updatedItems = currentItems.map((item) =>
      item.productId === productId ? { ...item, qty } : item
    )
    cartStorage.saveCart(storeId, updatedItems)
    return updatedItems
  },

  // Remove item from cart
  removeItem: (storeId: number, productId: number): CartItem[] => {
    const { items: currentItems } = cartStorage.loadCart()
    const updatedItems = currentItems.filter((i) => i.productId !== productId)
    cartStorage.saveCart(storeId, updatedItems)
    return updatedItems
  },
}

