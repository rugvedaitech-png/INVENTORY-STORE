import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { updateStoreSchema } from '@/lib/validators'
import { z } from 'zod'

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

// PATCH /api/stores/[slug] - Update store settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = updateStoreSchema.parse(body)

    // Get the store and verify ownership
    const store = await db.store.findUnique({
      where: { slug }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Check if user is the store owner
    if (store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Filter out undefined values (Prisma doesn't accept undefined)
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    )

    // Update store
    const updatedStore = await db.store.update({
      where: { slug },
      data: updateData
    })

    return NextResponse.json({ store: updatedStore })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating store:', error)
    return NextResponse.json(
      { error: 'Failed to update store' },
      { status: 500 }
    )
  }
}
