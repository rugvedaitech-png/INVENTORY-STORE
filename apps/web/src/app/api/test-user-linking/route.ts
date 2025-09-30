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

    // Test if we can query orders with user information
    const orders = await db.order.findMany({
      take: 5,
      include: {
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
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      message: 'User linking test successful',
      orders: orders.map(order => ({
        id: order.id,
        buyerName: order.buyerName,
        customerId: order.customerId,
        userInfo: order.user ? {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email
        } : null,
        itemCount: order.items.length
      })),
      currentUserId: session.user.id
    })
  } catch (error) {
    console.error('User linking test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 })
  }
}
