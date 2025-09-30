import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Temporary fix for UserRole import issue
enum UserRole {
  STORE_OWNER = 'STORE_OWNER',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get store ID
    const store = await db.store.findFirst({
      where: { ownerId: parseInt(session.user.id) }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range
    let dateFilter: any = {}
    if (range === 'custom' && startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else {
      const now = new Date()
      let daysBack = 30
      
      switch (range) {
        case '7d':
          daysBack = 7
          break
        case '30d':
          daysBack = 30
          break
        case '90d':
          daysBack = 90
          break
        case '1y':
          daysBack = 365
          break
      }
      
      dateFilter = {
        gte: new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
      }
    }

    // Fetch orders with items
    const orders = await db.order.findMany({
      where: {
        storeId: store.id,
        createdAt: dateFilter
      },
      include: {
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate summary metrics
    const totalOrders = orders.length
    const totalRevenue = orders
      .filter(order => order.status === 'CONFIRMED')
      .reduce((sum, order) => sum + order.totalAmount, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Status breakdown
    const statusBreakdown = {
      pending: orders.filter(order => order.status === 'PENDING').length,
      confirmed: orders.filter(order => order.status === 'CONFIRMED').length,
      delivered: orders.filter(order => order.status === 'DELIVERED').length,
      cancelled: orders.filter(order => order.status === 'CANCELLED').length
    }

    // Top products by revenue
    const productRevenue = new Map<number, { title: string, totalSold: number, revenue: number }>()
    
    orders.forEach(order => {
      if (order.status === 'CONFIRMED') {
        order.items.forEach(item => {
          const existing = productRevenue.get(item.productId) || {
            title: item.product.title,
            totalSold: 0,
            revenue: 0
          }
          existing.totalSold += item.qty
          existing.revenue += item.qty * item.priceSnap
          productRevenue.set(item.productId, existing)
        })
      }
    })

    const topProducts = Array.from(productRevenue.entries())
      .map(([productId, data]) => ({
        productId,
        ...data
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Daily revenue trends
    const dailyRevenue = new Map<string, { revenue: number, orders: number }>()
    
    orders.forEach(order => {
      if (order.status === 'CONFIRMED') {
        const date = order.createdAt.toISOString().split('T')[0]
        const existing = dailyRevenue.get(date) || { revenue: 0, orders: 0 }
        existing.revenue += order.totalAmount
        existing.orders += 1
        dailyRevenue.set(date, existing)
      }
    })

    const dailyRevenueArray = Array.from(dailyRevenue.entries())
      .map(([date, data]) => ({
        date,
        ...data
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const reportData = {
      orders: orders.map(order => ({
        id: order.id,
        buyerName: order.buyerName,
        phone: order.phone,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map(item => ({
          product: {
            title: item.product.title
          },
          qty: item.qty,
          priceSnap: item.priceSnap
        }))
      })),
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        statusBreakdown,
        topProducts,
        dailyRevenue: dailyRevenueArray
      }
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error('Error fetching orders report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders report' },
      { status: 500 }
    )
  }
}
