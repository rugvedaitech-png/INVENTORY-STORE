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

    const { searchParams } = new URL(request.url)
    const storeIdParam = searchParams.get('storeId')
    const productIdParam = searchParams.get('productId')
    const refType = searchParams.get('refType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!storeIdParam) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }
    const storeId = parseInt(storeIdParam)

    // Check if user owns the store
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: parseInt(session.user.id) },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: { storeId: number; productId?: number; refType?: any } = { storeId }
    if (productIdParam) {
      where.productId = parseInt(productIdParam)
    }
    if (refType) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.refType = refType as any
    }

    const [entries, total] = await Promise.all([
      db.stockLedger.findMany({
        where,
        include: {
          product: {
            select: {
              title: true,
              sku: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.stockLedger.count({ where }),
    ])

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching stock ledger:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock ledger' },
      { status: 500 }
    )
  }
}
