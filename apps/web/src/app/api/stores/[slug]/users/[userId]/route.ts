import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Temporary fix for UserRole import issue
enum UserRole {
  STORE_OWNER = 'STORE_OWNER',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

// PUT /api/stores/[slug]/users/[userId] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, userId } = await params
    const { name, email, phone } = await request.json()

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

    // Get the user to update
    const userToUpdate = await db.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only allow editing CUSTOMER and SUPPLIER roles
    if (userToUpdate.role === UserRole.STORE_OWNER) {
      return NextResponse.json(
        { error: 'Cannot edit store owner' },
        { status: 403 }
      )
    }

    // Verify user belongs to this store
    if (userToUpdate.storeId !== store.id) {
      return NextResponse.json(
        { error: 'User does not belong to this store' },
        { status: 403 }
      )
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== userToUpdate.email) {
      const existingUser = await db.user.findUnique({
        where: { email: email.toLowerCase() }
      })
      if (existingUser && existingUser.id !== parseInt(userId)) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: parseInt(userId) },
      data: {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() }),
        ...(phone !== undefined && { phone: phone || null })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/stores/[slug]/users/[userId] - Soft delete a user (temporary delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, userId } = await params

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

    // Prevent self-deletion
    if (parseInt(userId) === parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get the user to delete
    const userToDelete = await db.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only allow deleting CUSTOMER and SUPPLIER roles
    if (userToDelete.role === UserRole.STORE_OWNER) {
      return NextResponse.json(
        { error: 'Cannot delete store owner' },
        { status: 403 }
      )
    }

    // Verify user belongs to this store
    if (userToDelete.storeId !== store.id) {
      return NextResponse.json(
        { error: 'User does not belong to this store' },
        { status: 403 }
      )
    }

    // Soft delete: Set storeId to null (disassociate from store)
    // This keeps the user record but removes them from the store
    await db.user.update({
      where: { id: parseInt(userId) },
      data: {
        storeId: null
      }
    })

    return NextResponse.json({
      message: 'User temporarily deleted (removed from store)'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

