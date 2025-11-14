import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Test if we can query the order table with the new schema
    const orders = await db.order.findMany({
      take: 1,
      select: {
        id: true,
        customerId: true,
        buyerName: true,
        status: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Schema test successful',
      orders: orders,
      schemaInfo: {
        hasCustomerId: true,
        orderCount: orders.length
      }
    })
  } catch (error) {
    console.error('Schema test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No stack trace',
      schemaInfo: {
        hasCustomerId: false,
        errorType: 'schema_mismatch'
      }
    }, { status: 500 })
  }
}
