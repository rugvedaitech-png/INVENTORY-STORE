import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stores/[slug]/categories - Get categories for a public store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const storeSlug = slug

    // Get the store
    const store = await db.store.findUnique({
      where: { slug: storeSlug }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Get active categories with product counts
    const categories = await db.category.findMany({
      where: {
        storeId: store.id,
        active: true
      },
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
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching store categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
