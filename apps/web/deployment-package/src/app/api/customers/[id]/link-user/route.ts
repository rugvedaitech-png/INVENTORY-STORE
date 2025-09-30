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
    const customerId = parseInt(id)
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: { store: true }
    })
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    if (customer.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate user is CUSTOMER and belongs to same store (or assign if null)
    const user = await db.user.findFirst({ where: { id: Number(userId), role: 'CUSTOMER' } })
    if (!user) {
      return NextResponse.json({ error: 'User not found or not a customer' }, { status: 404 })
    }
    if (user.storeId && user.storeId !== customer.storeId) {
      return NextResponse.json({ error: 'User belongs to a different store' }, { status: 400 })
    }
    if (!user.storeId) {
      await db.user.update({ where: { id: user.id }, data: { storeId: customer.storeId } })
    }

    // Ensure user not linked elsewhere
    const existing = await db.customer.findFirst({ where: { userId: Number(userId) } })
    if (existing && existing.id !== customerId) {
      return NextResponse.json({ error: 'User already linked to another customer' }, { status: 400 })
    }

    const updated = await db.customer.update({
      where: { id: customerId },
      data: { userId: Number(userId) },
      include: { user: { select: { id: true, email: true, name: true } } }
    })

    return NextResponse.json({ success: true, customer: updated })
  } catch (error) {
    console.error('Error linking user to customer:', error)
    return NextResponse.json({ error: 'Failed to link user' }, { status: 500 })
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
    const customerId = parseInt(id)

    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: { store: true }
    })
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    if (customer.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await db.customer.update({
      where: { id: customerId },
      data: { userId: null },
      include: { user: true }
    })

    return NextResponse.json({ success: true, customer: updated })
  } catch (error) {
    console.error('Error unlinking user from customer:', error)
    return NextResponse.json({ error: 'Failed to unlink user' }, { status: 500 })
  }
}


