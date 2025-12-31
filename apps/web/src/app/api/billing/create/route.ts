import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { decimalToNumber } from '@/lib/money'

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

    const { storeId, items, paymentMethod, customerId, discount, taxRate } = await request.json()

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

    // Get customer info if customerId is provided
    let customer = null
    let buyerName = 'Walk-In'
    let customerPhone = ''
    
    if (customerId) {
      customer = await db.customer.findFirst({
        where: {
          id: parseInt(customerId),
          storeId: parseInt(storeId),
        },
      })
      
      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        )
      }
      
      buyerName = customer.name
      customerPhone = customer.phone
    }

    // Calculate totals (all in rupees)
    const subtotal = items.reduce(
      (sum: number, item: { qty: number; price: number | string | Decimal }) => {
        // Convert price to number if it's a Decimal
        const price = decimalToNumber(item.price)
        return sum + item.qty * price
      },
      0
    )

    // Calculate discount
    let discountAmount = 0
    let discountType: 'AMOUNT' | 'PERCENTAGE' = 'AMOUNT'
    
    if (discount && discount.value > 0) {
      discountType = discount.type || 'AMOUNT'
      if (discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * discount.value) / 100
      } else {
        discountAmount = Math.min(discount.value, subtotal)
      }
    }

    // Calculate amount after discount
    const amountAfterDiscount = subtotal - discountAmount

    // Calculate tax-inclusive pricing
    // Tax is included in the price, so we extract it from the total
    // Taxable amount = Total / (1 + taxRate/100)
    // Tax amount = Total - Taxable amount
    const taxRateValue = taxRate || 0
    const taxableAmount = taxRateValue > 0 
      ? amountAfterDiscount / (1 + taxRateValue / 100)
      : amountAfterDiscount
    const taxAmount = amountAfterDiscount - taxableAmount

    // Total is the amount after discount (which already includes tax)
    const totalAmount = amountAfterDiscount

    // Create order in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create order (convert to Decimal strings for Prisma)
      const order = await tx.order.create({
        data: {
          storeId: parseInt(storeId),
          customerId: customer ? customer.id : null,
          addressId: null,
          buyerName: buyerName,
          phone: customerPhone,
          address: null,
          status: 'CONFIRMED', // POS orders are auto-confirmed
          paymentMethod: paymentMethod || 'COD',
          paymentRef: null,
          subtotal: subtotal.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          discountType: discountType,
          taxRate: taxRateValue > 0 ? taxRateValue.toFixed(2) : null,
          taxableAmount: taxRateValue > 0 ? taxableAmount.toFixed(2) : null,
          taxAmount: taxRateValue > 0 ? taxAmount.toFixed(2) : null,
          totalAmount: totalAmount.toFixed(2),
        },
      })

      // Create order items and update stock
      const orderItems = []
      const stockLedgerEntries = []

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!
        
        // Create order item (convert price to Decimal string)
        const priceValue = typeof item.price === 'object' && 'toNumber' in item.price 
          ? item.price.toNumber() 
          : Number(item.price)
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            qty: item.qty,
            priceSnap: priceValue.toFixed(2),
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

