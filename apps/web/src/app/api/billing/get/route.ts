import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/billing/get?id=ORDER_ID - Get order details for receipt
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Fetch order with all related data
    const order = await db.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            whatsapp: true,
            upiId: true,
            billLayout: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                sku: true,
                price: true,
                costPrice: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify store ownership
    const store = await db.store.findFirst({
      where: {
        id: order.storeId,
        ownerId: parseInt(session.user.id),
      },
    })

    if (!store) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: `ORD-${order.id}`,
        buyerName: order.buyerName,
        phone: order.phone,
        status: order.status,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        store: order.store,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productTitle: item.product.title,
          productSku: item.product.sku,
          qty: item.qty,
          price: item.priceSnap,
          mrp: item.product.price, // Use current price as MRP
          lineTotal: item.qty * item.priceSnap,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

