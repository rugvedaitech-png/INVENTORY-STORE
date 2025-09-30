import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden - Customer access required' }, { status: 403 })
    }

    const { id } = await params
    const addressId = parseInt(id)
    const body = await request.json()

    // Find customer
    const customer = await db.customer.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    // Verify address belongs to customer
    const address = await db.customerAddress.findFirst({
      where: { id: addressId, customerId: customer.id }
    })

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    const { setAsActive, ...updateData } = body

    // Use transaction for active address management
    const updatedAddress = await db.$transaction(async (tx) => {
      // If setting as active, deactivate all other addresses
      if (setAsActive === true) {
        await tx.customerAddress.updateMany({
          where: { customerId: customer.id, isActive: true, id: { not: addressId } },
          data: { isActive: false }
        })
        updateData.isActive = true
      }

      // Update the address
      return await tx.customerAddress.update({
        where: { id: addressId },
        data: updateData
      })
    })

    return NextResponse.json(updatedAddress)

  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden - Customer access required' }, { status: 403 })
    }

    const { id } = await params
    const addressId = parseInt(id)

    // Find customer
    const customer = await db.customer.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    // Verify address belongs to customer
    const address = await db.customerAddress.findFirst({
      where: { id: addressId, customerId: customer.id }
    })

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // Cannot delete active address if it's the only one
    const addressCount = await db.customerAddress.count({
      where: { customerId: customer.id }
    })

    if (address.isActive && addressCount === 1) {
      return NextResponse.json({ 
        error: 'Cannot delete the only address. Add another address first.' 
      }, { status: 400 })
    }

    // Use transaction to handle active address reassignment
    await db.$transaction(async (tx) => {
      // Delete the address
      await tx.customerAddress.delete({
        where: { id: addressId }
      })

      // If deleted address was active, make the most recent address active
      if (address.isActive && addressCount > 1) {
        const nextAddress = await tx.customerAddress.findFirst({
          where: { customerId: customer.id },
          orderBy: { createdAt: 'desc' }
        })

        if (nextAddress) {
          await tx.customerAddress.update({
            where: { id: nextAddress.id },
            data: { isActive: true }
          })
        }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}
