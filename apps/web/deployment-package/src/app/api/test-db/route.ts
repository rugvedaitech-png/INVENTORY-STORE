import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await db.$connect()
    
    // Test if we can query the store table
    const stores = await db.store.findMany({
      take: 1
    })
    
    // Test if we can query the order table
    const orders = await db.order.findMany({
      take: 1
    })
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      storesCount: stores.length,
      ordersCount: orders.length,
      databaseUrl: process.env.DATABASE_URL || 'Using fallback URL'
    })
  } catch (error) {
    console.error('Database test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No stack trace',
      databaseUrl: process.env.DATABASE_URL || 'Using fallback URL'
    }, { status: 500 })
  }
}
