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

    if (session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Only suppliers can mark orders as shipped' }, { status: 403 })
    }

    const { id } = await params
    const poId = parseInt(id)
    if (isNaN(poId)) {
      return NextResponse.json({ error: 'Invalid purchase order ID' }, { status: 400 })
    }

    const body = await request.json()
    const { notes } = body

    // Get supplier information for this user
    const supplier = await db.supplier.findFirst({
      where: { 
        userId: parseInt(session.user.id)
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Get the purchase order
    const purchaseOrder = await db.purchaseOrder.findFirst({
      where: {
        id: poId,
        supplierId: supplier.id
      }
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if PO can be shipped
    if (purchaseOrder.status !== 'SENT' && purchaseOrder.status !== 'QUOTATION_APPROVED') {
      return NextResponse.json({ 
        error: 'Purchase order must be in SENT or QUOTATION_APPROVED status to be marked as shipped' 
      }, { status: 400 })
    }

    // Update status to SHIPPED
    const updatedPO = await db.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'SHIPPED' }
    })

    // Create audit log
    await db.purchaseOrderAuditLog.create({
      data: {
        purchaseOrderId: poId,
        userId: parseInt(session.user.id),
        action: 'shipped',
        previousStatus: purchaseOrder.status,
        newStatus: 'SHIPPED',
        notes: notes || 'Order marked as shipped by supplier'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Purchase order marked as shipped',
      purchaseOrder: updatedPO
    })
  } catch (error) {
    console.error('Error marking purchase order as shipped:', error)
    return NextResponse.json(
      { error: 'Failed to mark purchase order as shipped' },
      { status: 500 }
    )
  }
}
