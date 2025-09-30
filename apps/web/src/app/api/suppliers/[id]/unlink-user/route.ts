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

    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Only store owners can unlink users' }, { status: 403 })
    }

    const { id } = await params
    const supplierId = parseInt(id)
    if (isNaN(supplierId)) {
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 })
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

    // Check if supplier exists and belongs to the store
    const supplier = await db.supplier.findFirst({
      where: {
        id: supplierId,
        storeId: userStore.id
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    if (!supplier.userId) {
      return NextResponse.json({ error: 'Supplier is not linked to any user' }, { status: 400 })
    }

    // Unlink supplier from user
    const updatedSupplier = await db.supplier.update({
      where: { id: supplierId },
      data: { userId: null }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User unlinked successfully',
      supplier: updatedSupplier
    })
  } catch (error) {
    console.error('Error unlinking user from supplier:', error)
    return NextResponse.json(
      { error: 'Failed to unlink user' },
      { status: 500 }
    )
  }
}
