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

    // Only store owners can access customer details
    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Forbidden - Store owner access required' }, { status: 403 })
    }

    const { id } = await params
    const customerId = parseInt(id)

    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        store: true,
        user: {
          select: { id: true, email: true, name: true, phone: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Verify store ownership
    if (customer.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get orders for this customer
    const { searchParams } = new URL(request.url)
    const ordersPage = parseInt(searchParams.get('ordersPage') || '1')
    const ordersLimit = parseInt(searchParams.get('ordersLimit') || '10')

    // Only load orders if customer has a linked user ID
    let orders: any[] = []
    let ordersTotal = 0

    if (customer.userId) {
      // Only fetch orders using the linked user ID - no fallbacks
      const ordersWhere = {
        customerId: customer.userId
      }

      const [ordersData, ordersCount] = await Promise.all([
        db.order.findMany({
          where: ordersWhere,
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, title: true, sku: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (ordersPage - 1) * ordersLimit,
          take: ordersLimit
        }),
        db.order.count({
          where: ordersWhere
        })
      ])

      orders = ordersData
      ordersTotal = ordersCount
    }
    // If customer has no linked user, orders array remains empty

    return NextResponse.json({
      customer,
      orders,
      ordersPagination: {
        page: ordersPage,
        limit: ordersLimit,
        total: ordersTotal,
        pages: Math.ceil(ordersTotal / ordersLimit)
      }
    })
  } catch (error) {
    console.error('Error fetching customer details:', error)
    return NextResponse.json({ error: 'Failed to fetch customer details' }, { status: 500 })
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

    const { id } = await params
    const customerId = parseInt(id)
    const body = await request.json()

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

    // Validation for updates
    const updateData: any = {}
    
    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
      }
      updateData.name = body.name.trim()
    }

    if (body.email !== undefined) {
      if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
      
      // Check email uniqueness
      const emailExists = await db.customer.findFirst({
        where: {
          storeId: customer.storeId,
          email: body.email.toLowerCase(),
          id: { not: customerId }
        }
      })
      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists for another customer in this store' }, { status: 400 })
      }
      updateData.email = body.email.toLowerCase().trim()
    }

    if (body.phone !== undefined) {
      if (!body.phone || !/^[\+]?[1-9][\d]{0,15}$/.test(body.phone.replace(/\s/g, ''))) {
        return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
      }
      
      // Check phone uniqueness
      const phoneExists = await db.customer.findFirst({
        where: {
          storeId: customer.storeId,
          phone: body.phone.replace(/\s/g, ''),
          id: { not: customerId }
        }
      })
      if (phoneExists) {
        return NextResponse.json({ error: 'Phone number already exists for another customer in this store' }, { status: 400 })
      }
      updateData.phone = body.phone.replace(/\s/g, '')
    }

    if (body.address !== undefined) {
      updateData.address = body.address ? body.address.trim() : null
    }

    const updated = await db.customer.update({
      where: { id: customerId },
      data: updateData,
      include: { user: { select: { id: true, email: true, name: true } } }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
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

    await db.customer.delete({ where: { id: customerId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}