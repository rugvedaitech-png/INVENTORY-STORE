import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { decimalToNumber } from '@/lib/money'

// GET /api/analytics/income - Get income analysis by user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Get orders with user information
    const orders = await db.order.findMany({
      where: {
        storeId: parseInt(storeId),
        status: 'CONFIRMED',
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
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

    // Calculate income by user
    const incomeByUser = orders.reduce((acc, order) => {
      const userId = order.user?.id || 'guest'
      const userKey = order.user ? `${order.user.name || order.user.email} (${order.user.email})` : `Guest (${order.buyerName})`
      
      if (!acc[userId]) {
        acc[userId] = {
          userId: userId,
          userName: userKey,
          totalOrders: 0,
          totalAmount: 0,
          orders: []
        }
      }
      
      acc[userId].totalOrders += 1
      const orderAmount = decimalToNumber(order.totalAmount)
      acc[userId].totalAmount += orderAmount
      acc[userId].orders.push({
        id: order.id,
        amount: orderAmount,
        date: order.createdAt,
        items: order.items.length
      })
      
      return acc
    }, {} as any)

    // Convert to array and sort by total amount
    const incomeAnalysis = Object.values(incomeByUser).sort((a: any, b: any) => b.totalAmount - a.totalAmount)

    // Calculate total income
    const totalIncome = orders.reduce((sum, order) => sum + decimalToNumber(order.totalAmount), 0)

    return NextResponse.json({
      totalIncome,
      totalOrders: orders.length,
      incomeByUser: incomeAnalysis,
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    })
  } catch (error) {
    console.error('Error fetching income analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch income analysis' },
      { status: 500 }
    )
  }
}
