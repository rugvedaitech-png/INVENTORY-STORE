import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { updateSupplierSchema } from '@/lib/validators'

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
    const supplierId = parseInt(id)
    if (Number.isNaN(supplierId)) {
      return NextResponse.json({ error: 'Invalid supplier id' }, { status: 400 })
    }
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: {
        store: true,
        products: true,
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    if (supplier.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateSupplierSchema.parse(body)
    const { id } = await params
    const supplierId = parseInt(id)
    if (Number.isNaN(supplierId)) {
      return NextResponse.json({ error: 'Invalid supplier id' }, { status: 400 })
    }

    // Check if user owns the supplier
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: { store: true },
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    if (supplier.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedSupplier = await db.supplier.update({
      where: { id: supplierId },
      data: validatedData,
    })

    return NextResponse.json(updatedSupplier)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }

    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supplierId = parseInt(id)
    if (Number.isNaN(supplierId)) {
      return NextResponse.json({ error: 'Invalid supplier id' }, { status: 400 })
    }

    // Check if user owns the supplier
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: { store: true },
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    if (supplier.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.supplier.delete({
      where: { id: supplierId },
    })

    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}