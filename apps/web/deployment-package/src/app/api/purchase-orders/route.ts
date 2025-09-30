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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    // Check if user owns the store
    const store = await db.store.findFirst({
      where: { id: parseInt(storeId), ownerId: parseInt(session.user.id) },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: { storeId: number; status?: any } = { storeId: parseInt(storeId) }
    if (status) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.status = status as any
    }

    const [purchaseOrders, total] = await Promise.all([
      db.purchaseOrder.findMany({
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.purchaseOrder.count({ where }),
    ])

    return NextResponse.json({
      purchaseOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
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
    let poCode: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      const poCount = await db.purchaseOrder.count({
        where: { storeId: store.id },
      })
      const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
      poCode = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, '0')}-${timestamp}`
      
      // Check if code already exists
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

      // Set default cost to 0 since supplier will provide pricing
      const costPaise = 0
      const itemTotal = item.qty * costPaise
      subtotal += itemTotal

      items.push({
        productId: item.productId,
        qty: item.qty,
        costPaise: costPaise,
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
