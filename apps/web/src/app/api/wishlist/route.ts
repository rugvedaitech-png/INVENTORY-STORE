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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const [wishlistItems, total] = await Promise.all([
      db.wishlist.findMany({
        where: { userId: parseInt(session.user.id) },
        include: {
          product: {
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  whatsapp: true,
                  upiId: true,
                }
              },
              category: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.wishlist.count({ where: { userId: parseInt(session.user.id) } })
    ])

    return NextResponse.json({
      wishlist: wishlistItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check if product exists and is active
    const product = await db.product.findFirst({
      where: { 
        id: parseInt(productId),
        active: true
      },
      include: { store: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if already in wishlist
    const existingItem = await db.wishlist.findFirst({
      where: {
        userId: parseInt(session.user.id),
        productId: parseInt(productId)
      }
    })

    if (existingItem) {
      return NextResponse.json({ error: 'Product already in wishlist' }, { status: 400 })
    }

    // Add to wishlist
    const wishlistItem = await db.wishlist.create({
      data: {
        userId: parseInt(session.user.id),
        productId: parseInt(productId)
      },
      include: {
        product: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
                whatsapp: true,
                upiId: true,
              }
            },
            category: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(wishlistItem)
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Remove from wishlist
    await db.wishlist.deleteMany({
      where: {
        userId: parseInt(session.user.id),
        productId: parseInt(productId)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    )
  }
}
