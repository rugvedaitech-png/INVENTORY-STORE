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

    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Only store owners can access this endpoint' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const storeId = searchParams.get('storeId')

    // Get user's store
    const userStore = await db.store.findFirst({
      where: { 
        users: {
          some: { id: parseInt(session.user.id) }
        }
      }
    })

    if (!userStore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Build where clause
    const whereClause: any = {
      storeId: userStore.id
    }

    if (role) {
      whereClause.role = role
    }

    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
