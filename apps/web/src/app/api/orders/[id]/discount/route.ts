import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateDiscountSchema = z.object({
  discountAmount: z.number().int().min(0, 'Discount amount must be non-negative'),
  discountType: z.enum(['AMOUNT', 'PERCENTAGE'], {
    errorMap: () => ({ message: 'Discount type must be AMOUNT or PERCENTAGE' })
  })
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Forbidden - Store owner access required' }, { status: 403 })
    }

    const { id } = await params
    const orderId = parseInt(id)
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateDiscountSchema.parse(body)

    // Get the order and verify ownership
    const order = await db.order.findFirst({
      where: { 
        id: orderId,
        store: {
          ownerId: parseInt(session.user.id)
        }
      },
      include: {
        items: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Calculate subtotal from items
    const subtotal = order.items.reduce((sum, item) => sum + (item.priceSnap * item.qty), 0)

    // Calculate discount amount
    let discountAmount = 0
    if (validatedData.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * validatedData.discountAmount) / 100)
    } else {
      discountAmount = validatedData.discountAmount
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal)

    // Calculate final total
    const totalAmount = subtotal - discountAmount

    // Update the order with discount information
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        discountAmount,
        discountType: validatedData.discountType,
        totalAmount
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        store: true
      }
    })

    return NextResponse.json({
      order: updatedOrder,
      discount: {
        subtotal,
        discountAmount,
        discountType: validatedData.discountType,
        totalAmount
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating order discount:', error)
    return NextResponse.json(
      { error: 'Failed to update order discount' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Forbidden - Store owner access required' }, { status: 403 })
    }

    const { id } = await params
    const orderId = parseInt(id)
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    // Get the order and verify ownership
    const order = await db.order.findFirst({
      where: { 
        id: orderId,
        store: {
          ownerId: parseInt(session.user.id)
        }
      },
      include: {
        items: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Calculate subtotal from items
    const subtotal = order.items.reduce((sum, item) => sum + (item.priceSnap * item.qty), 0)

    // Remove discount (set to 0)
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        discountAmount: 0,
        discountType: 'AMOUNT',
        totalAmount: subtotal
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        store: true
      }
    })

    return NextResponse.json({
      order: updatedOrder,
      discount: {
        subtotal,
        discountAmount: 0,
        discountType: 'AMOUNT',
        totalAmount: subtotal
      }
    })
  } catch (error) {
    console.error('Error removing order discount:', error)
    return NextResponse.json(
      { error: 'Failed to remove order discount' },
      { status: 500 }
    )
  }
}
