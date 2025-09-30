import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Only suppliers can access this endpoint' }, { status: 403 })
    }

    const body = await request.json()
    const { supplierId } = body

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
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
        id: parseInt(supplierId),
        storeId: userStore.id
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Link supplier to user
    const updatedSupplier = await db.supplier.update({
      where: { id: supplier.id },
      data: { userId: parseInt(session.user.id) }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Supplier linked successfully',
      supplier: updatedSupplier
    })
  } catch (error) {
    console.error('Error linking supplier:', error)
    return NextResponse.json(
      { error: 'Failed to link supplier' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Only suppliers can access this endpoint' }, { status: 403 })
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

    // Get unlinked suppliers for this store
    const suppliers = await db.supplier.findMany({
      where: {
        storeId: userStore.id,
        userId: null
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return NextResponse.json({ suppliers })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}
