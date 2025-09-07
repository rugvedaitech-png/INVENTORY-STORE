import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createOrderSchema } from '@/lib/validators'
import { isRazorpayEnabled, createRazorpayOrder } from '@/lib/rzp'

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

    const orders = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    // Get store by slug (for public orders)
    const { searchParams } = new URL(request.url)
    const storeSlug = searchParams.get('store')

    if (!storeSlug) {
      return NextResponse.json({ error: 'Store slug is required' }, { status: 400 })
    }

    const store = await db.store.findUnique({
      where: { slug: storeSlug },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Calculate total amount and check stock
    let totalAmount = 0
    const orderItems: Array<{ productId: string; qty: number; priceSnap: number }> = []

    for (const item of validatedData.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        )
      }

      if (!product.active) {
        return NextResponse.json(
          { error: `Product is not available: ${product.title}` },
          { status: 400 }
        )
      }

      if (product.stock < item.qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.title}. Available: ${product.stock}` },
          { status: 409 }
        )
      }

      const itemTotal = product.price * item.qty
      totalAmount += itemTotal

      orderItems.push({
        productId: item.productId,
        qty: item.qty,
        priceSnap: product.price,
      })
    }

    // Create order in transaction
    const result = await db.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          storeId: store.id,
          buyerName: validatedData.buyerName,
          phone: validatedData.phone,
          address: validatedData.address,
          paymentMethod: validatedData.paymentMethod,
          totalAmount,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      // Update stock and create ledger entries for each item
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.qty,
            },
          },
        })

        await tx.stockLedger.create({
          data: {
            storeId: store.id,
            productId: item.productId,
            refType: 'SALE',
            refId: order.id,
            delta: -item.qty,
          },
        })
      }

      return order
    })

    // Handle payment based on method
    if (validatedData.paymentMethod === 'CARD' && isRazorpayEnabled()) {
      try {
        const razorpayOrder = await createRazorpayOrder(totalAmount, result.id)
        return NextResponse.json({
          ...result,
          razorpayOrderId: razorpayOrder.id,
        })
      } catch (error) {
        console.error('Razorpay order creation failed:', error)
        // Continue with order creation even if Razorpay fails
      }
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }

    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
