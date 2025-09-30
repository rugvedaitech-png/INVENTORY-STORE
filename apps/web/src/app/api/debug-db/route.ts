import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    await db.$connect()
    
    // Get user count
    const userCount = await db.user.count()
    
    // Get users by role
    const usersByRole = await db.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    })
    
    // Get all users
    const allUsers = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
    
    // Get suppliers
    const suppliers = await db.supplier.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        storeId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({ 
      success: true,
      userCount,
      usersByRole,
      allUsers,
      suppliers,
      supplierCount: suppliers.length
    })
  } catch (error) {
    console.error('Debug DB error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  } finally {
    await db.$disconnect()
  }
}
