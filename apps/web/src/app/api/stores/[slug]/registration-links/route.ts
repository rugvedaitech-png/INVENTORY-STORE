import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createRegistrationLinkSchema = z.object({
  role: z.enum(['CUSTOMER', 'SUPPLIER']),
  expiresInDays: z.number().int().min(1).max(30).default(7)
})

// GET /api/stores/[slug]/registration-links - Get existing registration links
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const storeSlug = slug

    // Check if user owns this store
    const store = await db.store.findFirst({
      where: {
        slug: storeSlug,
        ownerId: parseInt(session.user.id)
      }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // For now, we'll generate links on-demand
    // In a real app, you might want to store these in a database
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const customerLink = `${baseUrl}/auth/register?store=${store.slug}&role=CUSTOMER`
    const supplierLink = `${baseUrl}/auth/register?store=${store.slug}&role=SUPPLIER`

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug
      },
      links: {
        customer: customerLink,
        supplier: supplierLink
      }
    })
  } catch (error) {
    console.error('Error fetching registration links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registration links' },
      { status: 500 }
    )
  }
}

// POST /api/stores/[slug]/registration-links - Create a new registration link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const storeSlug = slug

    const body = await request.json()
    const validatedData = createRegistrationLinkSchema.parse(body)

    // Check if user owns this store
    const store = await db.store.findFirst({
      where: {
        slug: storeSlug,
        ownerId: parseInt(session.user.id)
      }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Generate registration link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const link = `${baseUrl}/auth/register?store=${store.slug}&role=${validatedData.role}`

    return NextResponse.json({
      link,
      role: validatedData.role,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug
      },
      expiresInDays: validatedData.expiresInDays
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating registration link:', error)
    return NextResponse.json(
      { error: 'Failed to create registration link' },
      { status: 500 }
    )
  }
}
