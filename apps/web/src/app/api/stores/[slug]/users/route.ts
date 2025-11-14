import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AuthService } from '@/lib/auth-service'

// Temporary fix for UserRole import issue
enum UserRole {
  STORE_OWNER = 'STORE_OWNER',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

// GET /api/stores/[slug]/users - Get all users for a store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params

    // Get the store and verify ownership
    const store = await db.store.findUnique({
      where: { slug },
      include: {
        owner: true,
        users: true
      }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Check if user is the store owner
    if (store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all users associated with this store
    const users = await db.user.findMany({
      where: {
        OR: [
          { id: store.ownerId }, // Store owner
          { storeId: store.id }  // Associated users
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching store users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store users' },
      { status: 500 }
    )
  }
}

// POST /api/stores/[slug]/users - Add a new user to the store
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const { name, email, phone, password, role } = await request.json()

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

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

    // Use AuthService to register user
    const user = await AuthService.register({
      name,
      email,
      phone: phone || null,
      password,
      role: role as UserRole,
      storeId: store.id
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to register user' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'User added to store successfully', 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          storeId: user.storeId
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding user to store:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
