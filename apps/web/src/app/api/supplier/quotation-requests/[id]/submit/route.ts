import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { decimalToNumber, numberToDecimal } from '@/lib/money'

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

    const { quotation } = await request.json()

    if (!quotation || typeof quotation !== 'object') {
      return NextResponse.json({ error: 'Invalid quotation data' }, { status: 400 })
    }

    // Get the supplier linked to this user
    const supplier = await db.supplier.findFirst({
      where: {
        userId: parseInt(session.user.id)
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Get the purchase order
    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: true
      }
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if supplier has access to this order
    if (purchaseOrder.supplierId !== supplier.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const allowedStatuses = ['QUOTATION_REQUESTED', 'QUOTATION_REVISION_REQUESTED']

    if (!allowedStatuses.includes(purchaseOrder.status)) {
      return NextResponse.json({ 
        error: 'Only requested quotations can be submitted' 
      }, { status: 400 })
    }

    // Update purchase order items with quoted costs
    const updatePromises = purchaseOrder.items.map(item => {
      const quotedCost = quotation[item.id]
      if (quotedCost !== undefined && quotedCost > 0) {
        return db.purchaseOrderItem.update({
          where: { id: item.id },
          data: { quotedCost: quotedCost } // Price is now in rupees
        })
      }
      return Promise.resolve()
    })

    await Promise.all(updatePromises)

    // Calculate new totals based on quoted costs
    const updatedItems = await db.purchaseOrderItem.findMany({
      where: { poId: poId }
    })

    const subtotal = updatedItems.reduce((sum, item) => {
      return sum + (decimalToNumber(item.quotedCost || item.cost) * item.qty)
    }, 0)

    const taxTotal = Math.round(subtotal * 0.18) // 18% GST
    const total = subtotal + taxTotal

    // Update the purchase order status and totals
    const updatedPO = await db.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'QUOTATION_SUBMITTED',
        quotationSubmittedAt: new Date(),
        quotationNotes: null,
        subtotal: subtotal,
        taxTotal: taxTotal,
        total: total
      }
    })

    // Create audit log entry
    await db.purchaseOrderAuditLog.create({
      data: {
        purchaseOrderId: poId,
        userId: parseInt(session.user.id),
        action: 'quotation_submitted',
        previousStatus: 'QUOTATION_REQUESTED',
        newStatus: 'QUOTATION_SUBMITTED',
        notes: 'Quotation submitted by supplier'
      }
    })

    return NextResponse.json({ 
      message: 'Quotation submitted successfully',
      purchaseOrder: updatedPO
    })

  } catch (error) {
    console.error('Error submitting quotation:', error)
    return NextResponse.json(
      { error: 'Failed to submit quotation' },
      { status: 500 }
    )
  }
}
