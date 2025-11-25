import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/billing/create - Create a POS bill/order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { storeId, items, paymentMethod } = await request.json()

    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'storeId and items array are required' },
        { status: 400 }
      )
    }

    // Verify store ownership
    const store = await db.store.findFirst({
      where: {
        id: parseInt(storeId),
        ownerId: parseInt(session.user.id),
      },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Validate all products exist and have sufficient stock
    const productIds = items.map((item: { productId: number }) => item.productId)
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        storeId: parseInt(storeId),
        active: true,
      },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 400 }
      )
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        )
      }
      if (product.stock < item.qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.title}. Available: ${product.stock}, Requested: ${item.qty}` },
          { status: 400 }
        )
      }
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { qty: number; price: number }) =>
        sum + item.qty * item.price,
      0
    )
    const discountAmount = 0
    const totalAmount = subtotal - discountAmount

    // Create order in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          storeId: parseInt(storeId),
          customerId: null, // Walk-in customer
          addressId: null,
          buyerName: 'Walk-In',
          phone: '',
          address: null,
          status: 'CONFIRMED', // POS orders are auto-confirmed
          paymentMethod: paymentMethod || 'COD',
          paymentRef: null,
          subtotal,
          discountAmount,
          discountType: 'AMOUNT',
          totalAmount,
        },
      })

      // Create order items and update stock
      const orderItems = []
      const stockLedgerEntries = []

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!
        
        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            qty: item.qty,
            priceSnap: item.price,
          },
        })
        orderItems.push(orderItem)

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.qty,
            },
          },
        })

        // Create stock ledger entry
        const ledgerEntry = await tx.stockLedger.create({
          data: {
            storeId: parseInt(storeId),
            productId: item.productId,
            refType: 'SALE',
            refId: order.id,
            delta: -item.qty, // Negative for sale
            unitCost: null, // Not applicable for sales
          },
        })
        stockLedgerEntries.push(ledgerEntry)
      }

      return { order, orderItems, stockLedgerEntries }
    })

    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      orderNumber: `ORD-${result.order.id}`,
      message: 'Bill created successfully',
    })
  } catch (error) {
    console.error('Error creating bill:', error)
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    )
  }
}

