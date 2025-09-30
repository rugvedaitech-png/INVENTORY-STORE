import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  costPrice: z.number().min(0, 'Cost price must be positive').optional(),
  stock: z.number().min(0, 'Stock must be non-negative'),
  images: z.string().default('[]'),
  active: z.boolean().default(true),
  categoryId: z.number().int().positive().optional(),
})

// GET /api/products - List products for the authenticated user's store or assigned store
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const active = searchParams.get('active')
    const categoryId = searchParams.get('categoryId')
    const storeId = searchParams.get('storeId') // For customers

    const skip = (page - 1) * limit

    let store

    // Check if this is a customer request with storeId
    if (storeId && session.user.role === 'CUSTOMER') {
      // For customers, get their assigned store
      const user = await db.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { store: true }
      })
      
      if (!user?.store || user.store.id !== parseInt(storeId)) {
        return NextResponse.json({ error: 'Store access denied' }, { status: 403 })
      }
      
      store = user.store
    } else {
      // For store owners, get their own store
      store = await db.store.findFirst({
        where: { ownerId: parseInt(session.user.id) }
      })
    }

    if (!store) {
      return NextResponse.json({
        products: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      })
    }

    // Build where clause
    const where: any = {
      storeId: store.id
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } }
      ]
    }

    if (active !== null) {
      where.active = active === 'true'
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          store: true,
          category: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.product.count({ where })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Get the user's store
    const store = await db.store.findFirst({
      where: { ownerId: parseInt(session.user.id) }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found for this user' },
        { status: 404 }
      )
    }

    const product = await db.product.create({
      data: {
        ...validatedData,
        storeId: store.id,
        images: JSON.stringify(validatedData.images ? JSON.parse(validatedData.images) : [])
      },
      include: {
        store: true,
        category: true
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}