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

    // Fetch purchase orders with items and supplier
    const purchaseOrders = await db.purchaseOrder.findMany({
      where: {
        storeId: store.id,
        createdAt: dateFilter
      },
      include: {
        supplier: {
          select: {
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate summary metrics
    const totalPurchaseOrders = purchaseOrders.length
    const totalCost = purchaseOrders
      .filter(po => po.status === 'RECEIVED')
      .reduce((sum, po) => sum + po.total, 0)
    const averageOrderValue = totalPurchaseOrders > 0 ? totalCost / totalPurchaseOrders : 0

    // Status breakdown
    const statusBreakdown = {
      draft: purchaseOrders.filter(po => po.status === 'DRAFT').length,
      placed: purchaseOrders.filter(po => po.status === 'PLACED').length,
      received: purchaseOrders.filter(po => po.status === 'RECEIVED').length,
      cancelled: purchaseOrders.filter(po => po.status === 'CANCELLED').length
    }

    // Top suppliers by cost
    const supplierCosts = new Map<number, { name: string, totalOrders: number, totalCost: number }>()
    
    purchaseOrders.forEach(po => {
      if (po.status === 'RECEIVED') {
        const existing = supplierCosts.get(po.supplierId) || {
          name: po.supplier.name,
          totalOrders: 0,
          totalCost: 0
        }
        existing.totalOrders += 1
        existing.totalCost += po.total
        supplierCosts.set(po.supplierId, existing)
      }
    })

    const topSuppliers = Array.from(supplierCosts.entries())
      .map(([supplierId, data]) => ({
        supplierId,
        ...data
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10)

    // Top products by purchase quantity and cost
    const productPurchases = new Map<number, { title: string, totalQty: number, totalCost: number }>()
    
    purchaseOrders.forEach(po => {
      if (po.status === 'RECEIVED') {
        po.items.forEach(item => {
          const existing = productPurchases.get(item.productId) || {
            title: item.product.title,
            totalQty: 0,
            totalCost: 0
          }
          existing.totalQty += item.qty
          existing.totalCost += item.qty * item.costPaise
          productPurchases.set(item.productId, existing)
        })
      }
    })

    const topProducts = Array.from(productPurchases.entries())
      .map(([productId, data]) => ({
        productId,
        ...data
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10)

    // Monthly trends
    const monthlyTrends = new Map<string, { orders: number, cost: number }>()
    
    purchaseOrders.forEach(po => {
      if (po.status === 'RECEIVED') {
        const month = po.createdAt.toISOString().substring(0, 7) // YYYY-MM
        const existing = monthlyTrends.get(month) || { orders: 0, cost: 0 }
        existing.orders += 1
        existing.cost += po.total
        monthlyTrends.set(month, existing)
      }
    })

    const monthlyTrendsArray = Array.from(monthlyTrends.entries())
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const reportData = {
      purchaseOrders: purchaseOrders.map(po => ({
        id: po.id,
        code: po.code,
        supplier: {
          name: po.supplier.name,
          email: po.supplier.email,
          phone: po.supplier.phone
        },
        status: po.status,
        total: po.total,
        subtotal: po.subtotal,
        taxTotal: po.taxTotal,
        createdAt: po.createdAt.toISOString(),
        placedAt: po.placedAt?.toISOString(),
        items: po.items.map(item => ({
          product: {
            title: item.product.title
          },
          qty: item.qty,
          costPaise: item.costPaise,
          receivedQty: item.receivedQty
        }))
      })),
      summary: {
        totalPurchaseOrders,
        totalCost,
        averageOrderValue,
        statusBreakdown,
        topSuppliers,
        topProducts,
        monthlyTrends: monthlyTrendsArray
      }
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error('Error fetching purchase orders report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders report' },
      { status: 500 }
    )
  }
}
