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
    const storeId = searchParams.get('storeId')
    const range = searchParams.get('range') || '30d'

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

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get comprehensive analytics
    const [
      totalRevenue,
      periodRevenue,
      orderStats,
      productStats,
      customerStats,
      topProducts,
      recentOrders,
      recentProducts,
      recentCustomers
    ] = await Promise.all([
      // Total revenue from confirmed orders
      db.order.aggregate({
        where: { 
          storeId: parseInt(storeId),
          status: 'CONFIRMED'
        },
        _sum: { totalAmount: true }
      }),
      
      // Revenue for the selected period
      db.order.aggregate({
        where: { 
          storeId: parseInt(storeId),
          status: 'CONFIRMED',
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      }),
      
      // Order statistics
      db.order.groupBy({
        by: ['status'],
        where: { 
          storeId: parseInt(storeId),
          createdAt: { gte: startDate }
        },
        _count: { status: true }
      }),
      
      // Product statistics
      db.product.aggregate({
        where: { 
          storeId: parseInt(storeId),
          active: true
        },
        _count: { id: true }
      }),
      
      // Customer statistics
      db.order.aggregate({
        where: { 
          storeId: parseInt(storeId),
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      }),
      
      // Top selling products
      db.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            storeId: parseInt(storeId),
            status: 'CONFIRMED',
            createdAt: { gte: startDate }
          }
        },
        _sum: { qty: true },
        _count: { productId: true },
        orderBy: { _sum: { qty: 'desc' } },
        take: 5
      }),
      
      // Recent orders
      db.order.findMany({
        where: { 
          storeId: parseInt(storeId),
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Recent products
      db.product.findMany({
        where: { 
          storeId: parseInt(storeId),
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          title: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Recent customers (from orders)
      db.order.findMany({
        where: { 
          storeId: parseInt(storeId),
          createdAt: { gte: startDate }
        },
        select: {
          buyerName: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        distinct: ['buyerName']
      })
    ])

    // Get product details for top products
    const topProductDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: { title: true }
        })
        
        // Calculate revenue for this product
        const productRevenue = await db.orderItem.aggregate({
          where: {
            productId: item.productId,
            order: {
              storeId: parseInt(storeId),
              status: 'CONFIRMED',
              createdAt: { gte: startDate }
            }
          },
          _sum: { priceSnap: true }
        })

        return {
          id: item.productId,
          title: product?.title || 'Unknown Product',
          totalSold: item._sum.qty || 0,
          revenue: (productRevenue._sum.priceSnap || 0) * (item._sum.qty || 0)
        }
      })
    )

    // Get low stock and out of stock counts
    const [lowStockCount, outOfStockCount] = await Promise.all([
      db.product.count({
        where: {
          storeId: parseInt(storeId),
          active: true,
          stock: { lte: 10, gt: 0 }
        }
      }),
      db.product.count({
        where: {
          storeId: parseInt(storeId),
          active: true,
          stock: 0
        }
      })
    ])

    // Create recent activity feed
    const recentActivity = [
      ...recentOrders.map(order => ({
        id: `order-${order.id}`,
        type: 'order' as const,
        description: `New order #${order.id} for ${(order.totalAmount / 100).toFixed(2)}`,
        timestamp: order.createdAt.toISOString()
      })),
      ...recentProducts.map(product => ({
        id: `product-${product.id}`,
        type: 'product' as const,
        description: `New product added: ${product.title}`,
        timestamp: product.createdAt.toISOString()
      })),
      ...recentCustomers.map(customer => ({
        id: `customer-${customer.buyerName}`,
        type: 'customer' as const,
        description: `New customer: ${customer.buyerName}`,
        timestamp: customer.createdAt.toISOString()
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)

    // Calculate order status counts
    const orderStatusCounts = {
      total: orderStats.reduce((sum, stat) => sum + stat._count.status, 0),
      confirmed: orderStats.find(s => s.status === 'CONFIRMED')?._count.status || 0,
      pending: orderStats.find(s => s.status === 'PENDING')?._count.status || 0,
      rejected: orderStats.find(s => s.status === 'REJECTED')?._count.status || 0,
      cancelled: orderStats.find(s => s.status === 'CANCELLED')?._count.status || 0
    }

    const analytics = {
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        monthly: periodRevenue._sum.totalAmount || 0,
        weekly: 0, // Could be calculated separately
        daily: 0   // Could be calculated separately
      },
      orders: orderStatusCounts,
      products: {
        total: productStats._count.id || 0,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount
      },
      customers: {
        total: customerStats._count.id || 0,
        newThisMonth: 0, // Could be calculated separately
        repeatCustomers: 0 // Could be calculated separately
      },
      topProducts: topProductDetails,
      recentActivity
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
