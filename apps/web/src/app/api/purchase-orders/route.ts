import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createPurchaseOrderSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const status = searchParams.get('status')

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    // Check if user owns the store
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: session.user.id },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: { storeId: string; status?: any } = { storeId }
    if (status) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.status = status as any
    }

    const purchaseOrders = await db.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(purchaseOrders)
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPurchaseOrderSchema.parse(body)

    // Get user's store
    const store = await db.store.findFirst({
      where: { ownerId: session.user.id },
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

    // Generate PO code
    const poCount = await db.purchaseOrder.count({
      where: { storeId: store.id },
    })
    const poCode = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, '0')}`

    // Calculate totals
    let subtotal = 0
    const items = []

    for (const item of validatedData.items) {
      const product = await db.product.findFirst({
        where: { id: item.productId, storeId: store.id },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        )
      }

      const itemTotal = item.qty * item.costPaise
      subtotal += itemTotal

      items.push({
        productId: item.productId,
        qty: item.qty,
        costPaise: item.costPaise,
      })
    }

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        storeId: store.id,
        supplierId: validatedData.supplierId,
        code: poCode,
        notes: validatedData.notes,
        subtotal,
        total: subtotal, // No tax for now
        items: {
          create: items,
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

    return NextResponse.json(purchaseOrder, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }

    console.error('Error creating purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}
