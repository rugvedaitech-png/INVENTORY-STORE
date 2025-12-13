import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Schema for bulk upload item
const bulkUploadItemSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  sku: z.string().min(1, 'SKU is required'),
  title: z.string().min(1, 'Product title is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().int().min(0, 'Unit cost must be non-negative'),
  description: z.string().optional(),
  price: z.number().int().min(0).optional(), // Selling price (optional)
})

const bulkUploadSchema = z.object({
  supplierId: z.number().int().positive(),
  totalAmount: z.number().int().min(0, 'Total amount must be non-negative'),
  notes: z.string().optional(),
  items: z.array(bulkUploadItemSchema).min(1, 'At least one item is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = bulkUploadSchema.parse(body)

    // Get user's store
    const store = await db.store.findFirst({
      where: { ownerId: parseInt(session.user.id) },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Verify supplier belongs to store
    const supplier = await db.supplier.findFirst({
      where: { id: validatedData.supplierId, storeId: store.id },
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Generate unique PO code
    let poCode = ''
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      const poCount = await db.purchaseOrder.count({
        where: { storeId: store.id },
      })
      const timestamp = Date.now().toString().slice(-6)
      poCode = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, '0')}-${timestamp}`
      
      const existingPO = await db.purchaseOrder.findFirst({
        where: { code: poCode },
      })
      
      if (!existingPO) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique PO code' },
        { status: 500 }
      )
    }

    // Process bulk upload in transaction
    const result = await db.$transaction(async (tx) => {
      const createdProducts: number[] = []
      const existingProducts: number[] = []
      const poItems: Array<{
        productId: number
        qty: number
        costPaise: number
        quotedCostPaise: number
        receivedQty: number
      }> = []

      // Process each item
      for (const item of validatedData.items) {
        // Find or create category
        const categoryName = item.category.trim()
        const categorySlug = createSlug(categoryName)
        
        let category = await tx.category.findFirst({
          where: {
            storeId: store.id,
            slug: categorySlug,
          },
        })

        if (!category) {
          // Check if slug already exists (shouldn't happen, but handle it)
          let finalSlug = categorySlug
          let slugExists = await tx.category.findFirst({
            where: {
              storeId: store.id,
              slug: finalSlug,
            },
          })

          // If slug exists, append a number to make it unique
          if (slugExists) {
            let counter = 1
            while (slugExists) {
              finalSlug = `${categorySlug}-${counter}`
              slugExists = await tx.category.findFirst({
                where: {
                  storeId: store.id,
                  slug: finalSlug,
                },
              })
              counter++
            }
          }

          category = await tx.category.create({
            data: {
              name: categoryName,
              slug: finalSlug,
              storeId: store.id,
              description: `Category created from bulk upload`,
              active: true,
              sortOrder: 0,
            },
          })
        }

        // Check if product exists by SKU
        let product = await tx.product.findFirst({
          where: {
            sku: item.sku.trim(),
            storeId: store.id,
          },
        })

        if (!product) {
          // Create new product
          const sellingPrice = item.price || Math.round(item.unitCost * 1.5) // Default 50% markup if price not provided
          
          product = await tx.product.create({
            data: {
              storeId: store.id,
              categoryId: category.id,
              title: item.title.trim(),
              description: item.description?.trim() || null,
              sku: item.sku.trim(),
              price: sellingPrice,
              costPrice: item.unitCost,
              stock: 0, // Will be updated after PO receipt
              reorderPoint: 0,
              reorderQty: 0,
              supplierId: supplier.id,
              images: '[]',
              active: true,
            },
          })
          createdProducts.push(product.id)
        } else {
          existingProducts.push(product.id)
        }

        // Add to PO items - mark as fully received since products are already in hand
        poItems.push({
          productId: product.id,
          qty: item.quantity,
          costPaise: item.unitCost,
          quotedCostPaise: item.unitCost, // Set quoted cost same as cost since already paid
          receivedQty: item.quantity, // Mark as fully received
        })
      }

      // Calculate subtotal from items
      const subtotal = poItems.reduce(
        (sum, item) => sum + item.qty * item.costPaise,
        0
      )

      // Create purchase order
      // Note: These are offline-procured products already paid for and received
      // Status is set to RECEIVED to bypass supplier quote workflow
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          storeId: store.id,
          supplierId: validatedData.supplierId,
          code: poCode,
          notes: validatedData.notes || `Bulk upload - Offline procurement (${validatedData.items.length} items)`,
          subtotal,
          total: validatedData.totalAmount, // Use provided total amount (already paid)
          status: 'RECEIVED', // Mark as received - bypasses quote workflow
          placedAt: new Date(),
          items: {
            create: poItems,
          },
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      // Update stock and create stock ledger entries
      for (const item of purchaseOrder.items) {
        const product = item.product
        const newStock = product.stock + item.qty

        // Update cost price (moving average)
        let newCostPrice = product.costPrice
        if (product.costPrice && product.stock > 0) {
          const totalCost = (product.costPrice * product.stock) + (item.costPaise * item.qty)
          newCostPrice = Math.round(totalCost / newStock)
        } else {
          newCostPrice = item.costPaise
        }

        // Update product stock and cost price
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: newStock,
            costPrice: newCostPrice,
          },
        })

        // Create stock ledger entry
        await tx.stockLedger.create({
          data: {
            storeId: store.id,
            productId: product.id,
            refType: 'PO_RECEIPT',
            refId: purchaseOrder.id,
            delta: item.qty,
            unitCost: item.costPaise,
          },
        })
      }

      return {
        purchaseOrder,
        createdProducts,
        existingProducts,
      }
    })

    return NextResponse.json({
      success: true,
      purchaseOrder: result.purchaseOrder,
      summary: {
        totalItems: validatedData.items.length,
        createdProducts: result.createdProducts.length,
        existingProducts: result.existingProducts.length,
        totalAmount: validatedData.totalAmount,
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error processing bulk upload:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    )
  }
}

