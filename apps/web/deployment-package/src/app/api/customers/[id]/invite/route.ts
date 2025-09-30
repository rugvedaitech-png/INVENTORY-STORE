import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only store owners can invite customers
    if (session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Forbidden - Store owner access required' }, { status: 403 })
    }

    const { id } = await params
    const customerId = parseInt(id)

    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: { store: true, user: true }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Verify store ownership
    if (customer.store.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if customer already has a linked user account
    if (customer.user) {
      return NextResponse.json({ 
        error: 'Customer already has a linked user account' 
      }, { status: 400 })
    }

    // Generate a unique invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store the invitation in database (you might want to create a separate invitations table)
    // For now, we'll use a simple approach with a temporary token storage
    const inviteData = {
      token: inviteToken,
      customerId: customer.id,
      storeId: customer.storeId,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      expiresAt: expiresAt.toISOString(),
      createdBy: parseInt(session.user.id)
    }

    // In a real implementation, you'd store this in a dedicated invitations table
    // For demo purposes, we'll return the invite link directly
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/auth/register?invite=${inviteToken}&email=${encodeURIComponent(customer.email)}&name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}&storeId=${customer.storeId}&customerId=${customer.id}`

    return NextResponse.json({
      success: true,
      message: 'Invitation generated successfully',
      inviteLink,
      expiresAt,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      }
    })

  } catch (error) {
    console.error('Error generating customer invitation:', error)
    return NextResponse.json({ error: 'Failed to generate invitation' }, { status: 500 })
  }
}
