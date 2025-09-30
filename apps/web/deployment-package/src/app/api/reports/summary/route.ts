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

    // Fetch data in parallel
    const [
      ordersData,
      purchaseOrdersData,
      revenueData,
      purchaseCostData
    ] = await Promise.all([
      // Orders data
      db.order.aggregate({
        where: {
          storeId: store.id,
          createdAt: dateFilter
        },
        _count: { id: true },
        _sum: { totalAmount: true }
      }),

      // Purchase orders data
      db.purchaseOrder.aggregate({
        where: {
          storeId: store.id,
          createdAt: dateFilter
        },
        _count: { id: true },
        _sum: { total: true }
      }),

      // Revenue from confirmed orders
      db.order.aggregate({
        where: {
          storeId: store.id,
          status: 'CONFIRMED',
          createdAt: dateFilter
        },
        _sum: { totalAmount: true }
      }),

      // Purchase costs from received purchase orders
      db.purchaseOrder.aggregate({
        where: {
          storeId: store.id,
          status: 'RECEIVED',
          createdAt: dateFilter
        },
        _sum: { total: true }
      }),

      // Pending orders count
      db.order.count({
        where: {
          storeId: store.id,
          status: 'PENDING',
          createdAt: dateFilter
        }
      }),

      // Pending purchase orders count
      db.purchaseOrder.count({
        where: {
          storeId: store.id,
          status: 'DRAFT',
          createdAt: dateFilter
        }
      })
    ])

    const [
      pendingOrders,
      pendingPurchaseOrders
    ] = await Promise.all([
      db.order.count({
        where: {
          storeId: store.id,
          status: 'PENDING',
          createdAt: dateFilter
        }
      }),
      db.purchaseOrder.count({
        where: {
          storeId: store.id,
          status: 'DRAFT',
          createdAt: dateFilter
        }
      })
    ])

    // Calculate metrics
    const totalOrders = ordersData._count.id || 0
    const totalPurchaseOrders = purchaseOrdersData._count.id || 0
    const totalRevenue = revenueData._sum.totalAmount || 0
    const totalPurchaseCost = purchaseCostData._sum.total || 0
    const netProfit = totalRevenue - totalPurchaseCost

    const summary = {
      totalOrders,
      totalPurchaseOrders,
      totalRevenue,
      totalPurchaseCost,
      netProfit,
      pendingOrders,
      pendingPurchaseOrders
    }

    return NextResponse.json(summary)

  } catch (error) {
    console.error('Error fetching report summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report summary' },
      { status: 500 }
    )
  }
}
