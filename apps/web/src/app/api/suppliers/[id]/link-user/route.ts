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
      return NextResponse.json({ error: 'Only store owners can link users' }, { status: 403 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
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

    // Check if user exists and has SUPPLIER role
    const user = await db.user.findFirst({
      where: {
        id: parseInt(userId),
        role: 'SUPPLIER'
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found or not a supplier' }, { status: 404 })
    }

    // Check if user is already linked to another supplier
    const existingSupplier = await db.supplier.findFirst({
      where: { userId: parseInt(userId) }
    })

    if (existingSupplier) {
      return NextResponse.json({ 
        error: 'User is already linked to another supplier' 
      }, { status: 400 })
    }

    // Link supplier to user
    const updatedSupplier = await db.supplier.update({
      where: { id: supplierId },
      data: { userId: parseInt(userId) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User linked successfully',
      supplier: updatedSupplier
    })
  } catch (error) {
    console.error('Error linking user to supplier:', error)
    return NextResponse.json(
      { error: 'Failed to link user' },
      { status: 500 }
    )
  }
}
