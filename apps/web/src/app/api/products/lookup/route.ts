import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/products/lookup - Lookup product by SKU
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { sku, storeId } = await request.json()

    if (!sku || !storeId) {
      return NextResponse.json(
        { error: 'SKU and storeId are required' },
        { status: 400 }
      )
    }

    // Get store to verify ownership
    const store = await db.store.findFirst({
      where: {
        id: parseInt(storeId),
        ownerId: parseInt(session.user.id),
      },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Find product by SKU and storeId
    const product = await db.product.findFirst({
      where: {
        sku: sku.trim().toUpperCase(),
        storeId: parseInt(storeId),
        active: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', found: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      found: true,
      product: {
        id: product.id,
        title: product.title,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
        description: product.description,
        images: product.images,
        category: product.category,
      },
    })
  } catch (error) {
    console.error('Error looking up product:', error)
    return NextResponse.json(
      { error: 'Failed to lookup product' },
      { status: 500 }
    )
  }
}

