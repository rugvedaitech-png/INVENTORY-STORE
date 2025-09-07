import { z } from 'zod'

// Product validators
export const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().int().min(0, 'Price must be non-negative'),
  costPrice: z.number().int().min(0).optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  reorderPoint: z.number().int().min(0, 'Reorder point must be non-negative'),
  reorderQty: z.number().int().min(0, 'Reorder quantity must be non-negative'),
  supplierId: z.string().optional(),
  images: z.string().default("[]"),
  active: z.boolean().default(true),
})

export const updateProductSchema = createProductSchema.partial()

// Order validators
export const createOrderSchema = z.object({
  buyerName: z.string().min(1, 'Buyer name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(1, 'Address is required'),
  paymentMethod: z.enum(['COD', 'UPI', 'CARD']),
  items: z.array(z.object({
    productId: z.string(),
    qty: z.number().int().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
})

// Supplier validators
export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  leadTimeDays: z.number().int().min(0, 'Lead time must be non-negative').default(3),
})

export const updateSupplierSchema = createSupplierSchema.partial()

// Purchase Order validators
export const createPurchaseOrderSchema = z.object({
  supplierId: z.string(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    qty: z.number().int().min(1, 'Quantity must be at least 1'),
    costPaise: z.number().int().min(0, 'Cost must be non-negative'),
  })).min(1, 'At least one item is required'),
})

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CLOSED', 'CANCELLED']),
})

export const receivePurchaseOrderSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    receivedQty: z.number().int().min(0, 'Received quantity must be non-negative'),
  })).min(1, 'At least one item is required'),
})

// Store validators
export const updateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  slug: z.string().min(1, 'Store slug is required'),
  whatsapp: z.string().optional(),
  upiId: z.string().optional(),
  currency: z.string().default('INR'),
})

// Auth validators
export const signInSchema = z.object({
  email: z.string().email('Valid email is required'),
})

