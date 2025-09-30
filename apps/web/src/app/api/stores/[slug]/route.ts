import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stores/[slug] - Get store information by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const storeSlug = slug
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const categoryId = searchParams.get('categoryId')

    const store = await db.store.findUnique({
      where: { slug: storeSlug },
      include: {
        categories: {
          where: { active: true },
          include: {
            _count: {
              select: {
                products: {
                  where: { active: true }
                }
              }
            }
          },
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' }
          ]
        }
      }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Build products where clause
    const productsWhere: any = { active: true }
    if (categoryId) {
      productsWhere.categoryId = parseInt(categoryId)
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      db.product.findMany({
        where: productsWhere,
        include: {
          category: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({
        where: productsWhere
      })
    ])

    return NextResponse.json({
      ...store,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('Error fetching store:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store' },
      { status: 500 }
    )
  }
}
