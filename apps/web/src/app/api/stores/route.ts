import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  slug: z.string().min(1, 'Store slug is required'),
  whatsapp: z.string().optional(),
  upiId: z.string().optional(),
  currency: z.string().default('INR')
})

// GET /api/stores - List stores for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stores = await db.store.findMany({
      where: {
        ownerId: parseInt(session.user.id)
      },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsapp: true,
        upiId: true,
        address: true,
        currency: true,
        billLayout: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ stores })
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    )
  }
}

// POST /api/stores - Create a new store
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createStoreSchema.parse(body)

    // Check if slug already exists
    const existingStore = await db.store.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingStore) {
      return NextResponse.json(
        { error: 'Store slug already exists' },
        { status: 400 }
      )
    }

    const store = await db.store.create({
      data: {
        ...validatedData,
        ownerId: parseInt(session.user.id)
      },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsapp: true,
        upiId: true,
        currency: true,
        createdAt: true
      }
    })

    return NextResponse.json(store, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating store:', error)
    return NextResponse.json(
      { error: 'Failed to create store' },
      { status: 500 }
    )
  }
}