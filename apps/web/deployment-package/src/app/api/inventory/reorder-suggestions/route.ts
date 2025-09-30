import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's store
    const store = await db.store.findFirst({
      where: { ownerId: parseInt(session.user.id) },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Find products that need reordering
    const products = await db.product.findMany({
      where: {
        storeId: store.id,
        active: true,
        stock: {
          lte: db.product.fields.reorderPoint,
        },
      },
      include: {
        supplier: true,
      },
    })

    const suggestions = products.map(product => {
      const proposedQty = Math.max(
        product.reorderQty,
        product.reorderPoint - product.stock + product.reorderQty
      )

      return {
        productId: product.id,
        title: product.title,
        sku: product.sku,
        currentStock: product.stock,
        reorderPoint: product.reorderPoint,
        reorderQty: product.reorderQty,
        proposedQty,
        supplier: product.supplier ? {
          id: product.supplier.id,
          name: product.supplier.name,
          leadTimeDays: product.supplier.leadTimeDays,
        } : null,
        daysOfCover: product.stock / Math.max(product.reorderQty || 1, 1),
      }
    })

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error fetching reorder suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reorder suggestions' },
      { status: 500 }
    )
  }
}

