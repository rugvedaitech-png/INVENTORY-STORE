import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const poId = parseInt(id)
    if (isNaN(poId)) {
      return NextResponse.json({ error: 'Invalid purchase order ID' }, { status: 400 })
    }

    // Get the purchase order
    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        store: true,
        supplier: true
      }
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if user has access to this store
    if (purchaseOrder.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if order is in QUOTATION_SUBMITTED status
    if (purchaseOrder.status !== 'QUOTATION_SUBMITTED') {
      return NextResponse.json({ 
        error: 'Only submitted quotations can be rejected' 
      }, { status: 400 })
    }

    // Update the purchase order status to QUOTATION_REJECTED
    const updatedPO = await db.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'QUOTATION_REJECTED',
        quotationRejectedAt: new Date()
      }
    })

    // Create audit log entry
    await db.purchaseOrderAuditLog.create({
      data: {
        purchaseOrderId: poId,
        userId: parseInt(session.user.id),
        action: 'quotation_rejected',
        previousStatus: 'QUOTATION_SUBMITTED',
        newStatus: 'QUOTATION_REJECTED',
        notes: 'Quotation rejected by store owner'
      }
    })

    return NextResponse.json({ 
      message: 'Quotation rejected successfully',
      purchaseOrder: updatedPO
    })

  } catch (error) {
    console.error('Error rejecting quotation:', error)
    return NextResponse.json(
      { error: 'Failed to reject quotation' },
      { status: 500 }
    )
  }
}
