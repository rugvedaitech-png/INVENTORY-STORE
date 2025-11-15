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

    const body = await request.json().catch(() => ({}))
    const notes =
      typeof body?.notes === 'string' && body.notes.trim().length > 0
        ? body.notes.trim()
        : null

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        store: true
      }
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (purchaseOrder.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (
      purchaseOrder.status !== 'QUOTATION_SUBMITTED' &&
      purchaseOrder.status !== 'QUOTATION_REVISION_REQUESTED'
    ) {
      return NextResponse.json(
        { error: 'Revisions can only be requested for submitted quotations' },
        { status: 400 }
      )
    }

    const updatedPO = await db.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'QUOTATION_REVISION_REQUESTED',
        quotationNotes: notes
      }
    })

    await db.purchaseOrderAuditLog.create({
      data: {
        purchaseOrderId: poId,
        userId: parseInt(session.user.id),
        action: 'quotation_revision_requested',
        previousStatus: purchaseOrder.status,
        newStatus: 'QUOTATION_REVISION_REQUESTED',
        notes: notes || undefined
      }
    })

    return NextResponse.json({
      message: 'Revision requested successfully',
      purchaseOrder: updatedPO
    })
  } catch (error) {
    console.error('Error requesting quotation revision:', error)
    return NextResponse.json(
      { error: 'Failed to request quotation revision' },
      { status: 500 }
    )
  }
}

