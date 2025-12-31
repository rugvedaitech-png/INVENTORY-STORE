import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { decimalToNumber } from '@/lib/money'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Only store owners can confirm purchase orders' }, { status: 403 })
    }

    const { id } = await params
    const poId = parseInt(id)
    if (isNaN(poId)) {
      return NextResponse.json({ error: 'Invalid purchase order ID' }, { status: 400 })
    }

    const body = await request.json()
    const { action, notes } = body // action: 'received' or 'rejected'

    if (!action || !['received', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Action must be either "received" or "rejected"' }, { status: 400 })
    }

    // Get user's store
    const userStore = await db.store.findFirst({
      where: { 
        users: {
          some: { id: parseInt(session.user.id) }
        }
      }
    })

    if (!userStore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Get the purchase order
    const purchaseOrder = await db.purchaseOrder.findFirst({
      where: {
        id: poId,
        storeId: userStore.id
      }
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if PO can be confirmed
    if (purchaseOrder.status !== 'SHIPPED') {
      return NextResponse.json({ 
        error: 'Purchase order must be in SHIPPED status to be confirmed' 
      }, { status: 400 })
    }

    const newStatus = action === 'received' ? 'RECEIVED' : 'REJECTED'

    // Update status
    const updatedPO = await db.purchaseOrder.update({
      where: { id: poId },
      data: { status: newStatus }
    })

    // Create audit log
    await db.purchaseOrderAuditLog.create({
      data: {
        purchaseOrderId: poId,
        userId: parseInt(session.user.id),
        action: action,
        previousStatus: 'SHIPPED',
        newStatus: newStatus,
        notes: notes || `Order ${action} by store owner`
      }
    })

    // If received, update stock levels
    if (action === 'received') {
      // Get all items in this PO
      const poItems = await db.purchaseOrderItem.findMany({
        where: { poId: poId },
        include: { product: true }
      })

      // Update stock for each item
      for (const item of poItems) {
        // Add to stock ledger
        await db.stockLedger.create({
          data: {
            storeId: userStore.id,
            productId: item.productId,
            refType: 'PO_RECEIPT',
            refId: poId,
            delta: item.qty,
            unitCost: item.cost
          }
        })

        // Update product stock
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.qty
            }
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Purchase order ${action} successfully`,
      purchaseOrder: updatedPO
    })
  } catch (error) {
    console.error('Error confirming purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to confirm purchase order' },
      { status: 500 }
    )
  }
}
