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

    // Get the supplier linked to this user
    const supplier = await db.supplier.findFirst({
      where: {
        userId: parseInt(session.user.id)
      },
      include: {
        store: true
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get quotation requests for this supplier with pagination
    const [quotationRequests, total] = await Promise.all([
      db.purchaseOrder.findMany({
        where: {
          storeId: supplier.storeId,
          supplierId: supplier.id,
          status: {
            in: [
              'QUOTATION_REQUESTED',
              'QUOTATION_SUBMITTED',
              'QUOTATION_REVISION_REQUESTED',
              'QUOTATION_APPROVED',
              'QUOTATION_REJECTED'
            ]
          }
        },
        include: {
          supplier: {
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
                  id: true,
                  title: true,
                  sku: true
                }
              }
            }
          }
        },
        orderBy: { quotationRequestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.purchaseOrder.count({
        where: {
          storeId: supplier.storeId,
          supplierId: supplier.id,
          status: {
            in: [
              'QUOTATION_REQUESTED',
              'QUOTATION_SUBMITTED',
              'QUOTATION_REVISION_REQUESTED',
              'QUOTATION_APPROVED',
              'QUOTATION_REJECTED'
            ]
          }
        }
      })
    ])

    return NextResponse.json({ 
      quotationRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('Error fetching quotation requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotation requests' },
      { status: 500 }
    )
  }
}
