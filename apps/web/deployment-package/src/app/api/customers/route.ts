import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only store owners can access customer management
    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Forbidden - Store owner access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = (searchParams.get('search') || '').trim()
    const name = (searchParams.get('name') || '').trim()
    const email = (searchParams.get('email') || '').trim()
    const phone = (searchParams.get('phone') || '').trim()

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    // Verify ownership
    const store = await db.store.findFirst({
      where: { id: parseInt(storeId), ownerId: parseInt(session.user.id) },
    })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Build where clause with optional filters
    const where: any = { storeId: parseInt(storeId) }
    const andFilters: any[] = []
    if (search) {
      andFilters.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      })
    }
    if (name) andFilters.push({ name: { contains: name, mode: 'insensitive' } })
    if (email) andFilters.push({ email: { contains: email, mode: 'insensitive' } })
    if (phone) andFilters.push({ phone: { contains: phone, mode: 'insensitive' } })
    if (andFilters.length > 0) where.AND = andFilters
    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.customer.count({ where }),
    ])

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only store owners can create customers
    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Forbidden - Store owner access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    // Verify ownership
    const store = await db.store.findFirst({
      where: { id: parseInt(storeId), ownerId: parseInt(session.user.id) },
    })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, email, phone, address, userId } = body

    // Validation
    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Name, email and phone are required' }, { status: 400 })
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
    }

    // Check for uniqueness within the store
    const existingCustomer = await db.customer.findFirst({
      where: {
        storeId: parseInt(storeId),
        OR: [
          { email: email.toLowerCase() },
          { phone: phone.replace(/\s/g, '') }
        ]
      }
    })

    if (existingCustomer) {
      if (existingCustomer.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json({ error: 'Email already exists for another customer in this store' }, { status: 400 })
      }
      if (existingCustomer.phone.replace(/\s/g, '') === phone.replace(/\s/g, '')) {
        return NextResponse.json({ error: 'Phone number already exists for another customer in this store' }, { status: 400 })
      }
    }

    // Optional: link to existing CUSTOMER user
    let linkUserId: number | undefined
    if (userId) {
      const user = await db.user.findFirst({
        where: { id: Number(userId), role: 'CUSTOMER' },
      })
      if (!user) {
        return NextResponse.json({ error: 'User not found or not a customer' }, { status: 404 })
      }
      // Ensure user is not linked to another customer
      const existing = await db.customer.findFirst({ where: { userId: Number(userId) } })
      if (existing) {
        return NextResponse.json({ error: 'User already linked to another customer' }, { status: 400 })
      }
      // If user has no storeId, assign it to this store
      if (!user.storeId) {
        await db.user.update({ where: { id: user.id }, data: { storeId: parseInt(storeId) } })
      } else if (user.storeId !== parseInt(storeId)) {
        return NextResponse.json({ error: 'User belongs to a different store' }, { status: 400 })
      }
      linkUserId = Number(userId)
    }

    const customer = await db.customer.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.replace(/\s/g, ''),
        address: address ? address.trim() : null,
        storeId: parseInt(storeId),
        userId: linkUserId,
      },
      include: {
        user: { select: { id: true, email: true, name: true } }
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}

