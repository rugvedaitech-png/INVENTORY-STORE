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

    // Get user's stores
    const stores = await db.store.findMany({
      where: { ownerId: parseInt(session.user.id) },
      select: { id: true, name: true, slug: true }
    })

    // Get all orders for debugging
    const allOrders = await db.order.findMany({
      include: {
        store: {
          select: { id: true, name: true, slug: true }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: { title: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email
      },
      stores,
      orders: allOrders,
      totalOrders: allOrders.length
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 })
  }
}
