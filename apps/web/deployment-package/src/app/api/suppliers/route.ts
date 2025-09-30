import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createSupplierSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    // Check if user owns the store
    const store = await db.store.findFirst({
      where: { id: parseInt(storeId), ownerId: parseInt(session.user.id) },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where: { storeId: parseInt(storeId) },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          _count: {
            select: {
              products: true,
              purchaseOrders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.supplier.count({
        where: { storeId: parseInt(storeId) },
      })
    ])

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSupplierSchema.parse(body)

    // Get user's store
    const store = await db.store.findFirst({
      where: { ownerId: parseInt(session.user.id) },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // If userId is provided, fetch user details and use them
    let supplierData = { ...validatedData }
    
    if (validatedData.userId) {
      const user = await db.user.findUnique({
        where: { id: validatedData.userId },
        select: { name: true, email: true, phone: true }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Override name and email with user data
      supplierData.name = user.name || validatedData.name
      supplierData.email = user.email
      supplierData.phone = user.phone || validatedData.phone
    }

    const supplier = await db.supplier.create({
      data: {
        ...supplierData,
        storeId: store.id,
        userId: validatedData.userId || null,
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }

    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}

