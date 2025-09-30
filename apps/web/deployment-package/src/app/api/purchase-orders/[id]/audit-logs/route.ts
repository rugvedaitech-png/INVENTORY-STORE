import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
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

    // Check if user has access to this PO
    let hasAccess = false

    if (session.user.role === 'STORE_OWNER') {
      // Check if user owns the store
      const userStore = await db.store.findFirst({
        where: { 
          users: {
            some: { id: parseInt(session.user.id) }
          }
        }
      })

      if (userStore) {
        const po = await db.purchaseOrder.findFirst({
          where: {
            id: poId,
            storeId: userStore.id
          }
        })
        hasAccess = !!po
      }
    } else if (session.user.role === 'SUPPLIER') {
      // Check if supplier has access to this PO
      const supplier = await db.supplier.findFirst({
        where: { 
          userId: parseInt(session.user.id)
        }
      })

      if (supplier) {
        const po = await db.purchaseOrder.findFirst({
          where: {
            id: poId,
            supplierId: supplier.id
          }
        })
        hasAccess = !!po
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get audit logs
    const auditLogs = await db.purchaseOrderAuditLog.findMany({
      where: { purchaseOrderId: poId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ auditLogs })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
