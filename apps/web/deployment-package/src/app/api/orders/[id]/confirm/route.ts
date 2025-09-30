import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only store owners can confirm orders
    const isStoreOwner = await db.user.findFirst({
      where: { id: parseInt(session.user.id), role: UserRole.STORE_OWNER },
    })

    if (!isStoreOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const orderId = parseInt(id)
    
    // Get order and verify it belongs to the store owner's store
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if the store owner owns this order's store
    if (order.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Order not found in your store' }, { status: 404 })
    }

    // Check if order is in PENDING status
    if (order.status !== 'PENDING') {
      return NextResponse.json({ 
        error: `Order cannot be confirmed. Current status: ${order.status}` 
      }, { status: 400 })
    }

    // Update order status to CONFIRMED
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        updatedAt: new Date()
      },
      include: {
        store: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Order confirmed successfully',
      order: updatedOrder 
    })

  } catch (error) {
    console.error('Error confirming order:', error)
    return NextResponse.json(
      { error: 'Failed to confirm order' },
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

    // Only store owners can reject orders
    const isStoreOwner = await db.user.findFirst({
      where: { id: parseInt(session.user.id), role: UserRole.STORE_OWNER },
    })

    if (!isStoreOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const orderId = parseInt(id)
    
    // Get order and verify it belongs to the store owner's store
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if the store owner owns this order's store
    if (order.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Order not found in your store' }, { status: 404 })
    }

    // Check if order is in PENDING status
    if (order.status !== 'PENDING') {
      return NextResponse.json({ 
        error: `Order cannot be rejected. Current status: ${order.status}` 
      }, { status: 400 })
    }

    // Update order status to REJECTED and restore stock
    const updatedOrder = await db.$transaction(async (tx) => {
      // Update order status
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'REJECTED',
          updatedAt: new Date()
        },
        include: {
          items: true
        }
      })

      // Restore stock for each item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.qty
            }
          }
        })

        // Create stock ledger entry for restoration
        await tx.stockLedger.create({
          data: {
            storeId: order.storeId,
            productId: item.productId,
            refType: 'ADJUSTMENT',
            refId: orderId,
            delta: item.qty, // Positive delta to restore stock
          }
        })
      }

      return order
    })

    return NextResponse.json({ 
      message: 'Order rejected successfully. Stock has been restored.',
      order: updatedOrder 
    })

  } catch (error) {
    console.error('Error rejecting order:', error)
    return NextResponse.json(
      { error: 'Failed to reject order' },
      { status: 500 }
    )
  }
}