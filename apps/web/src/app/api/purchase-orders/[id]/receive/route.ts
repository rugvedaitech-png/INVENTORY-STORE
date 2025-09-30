import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { receivePurchaseOrderSchema } from '@/lib/validators'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = receivePurchaseOrderSchema.parse(body)
    const { id } = await params

    // Check if user owns the purchase order
    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        store: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (purchaseOrder.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (purchaseOrder.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot receive items for cancelled purchase order' },
        { status: 400 }
      )
    }

    // Validate receiving quantities
    for (const receiveItem of validatedData.items) {
      const poItem = purchaseOrder.items.find(item => item.id === receiveItem.itemId)
      if (!poItem) {
        return NextResponse.json(
          { error: `Purchase order item not found: ${receiveItem.itemId}` },
          { status: 404 }
        )
      }

      const remainingQty = poItem.qty - poItem.receivedQty
      if (receiveItem.receivedQty > remainingQty) {
        return NextResponse.json(
          { error: `Cannot receive ${receiveItem.receivedQty} items. Only ${remainingQty} remaining for ${poItem.product.title}` },
          { status: 400 }
        )
      }
    }

    // Process receiving in transaction
    const result = await db.$transaction(async (tx) => {
      // Update purchase order items and calculate new status
      let allReceived = true
      let someReceived = false

      for (const receiveItem of validatedData.items) {
        const poItem = purchaseOrder.items.find(item => item.id === receiveItem.itemId)!
        const newReceivedQty = poItem.receivedQty + receiveItem.receivedQty

        await tx.purchaseOrderItem.update({
          where: { id: receiveItem.itemId },
          data: { receivedQty: newReceivedQty },
        })

        // Update product stock and cost price (moving average)
        const product = poItem.product
        const newStock = product.stock + receiveItem.receivedQty
        
        let newCostPrice = product.costPrice
        if (product.costPrice && product.stock > 0) {
          // Moving average calculation
          const totalCost = (product.costPrice * product.stock) + (poItem.costPaise * receiveItem.receivedQty)
          newCostPrice = Math.round(totalCost / newStock)
        } else {
          newCostPrice = poItem.costPaise
        }

        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: newStock,
            costPrice: newCostPrice,
          },
        })

        // Create stock ledger entry
        await tx.stockLedger.create({
          data: {
            storeId: purchaseOrder.storeId,
            productId: product.id,
            refType: 'PO_RECEIPT',
            refId: purchaseOrder.id,
            delta: receiveItem.receivedQty,
            unitCost: poItem.costPaise,
          },
        })

        // Check if all items are fully received
        if (newReceivedQty < poItem.qty) {
          allReceived = false
        }
        if (newReceivedQty > 0) {
          someReceived = true
        }
      }

      // Determine new PO status
      let newStatus = purchaseOrder.status
      if (allReceived) {
        newStatus = 'RECEIVED'
      } else if (someReceived) {
        newStatus = 'PARTIAL'
      }

      // Update purchase order status
      const updatedPO = await tx.purchaseOrder.update({
        where: { id },
        data: { status: newStatus },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      return updatedPO
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }

    console.error('Error receiving purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to receive purchase order' },
      { status: 500 }
    )
  }
}