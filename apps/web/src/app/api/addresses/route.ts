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

    // Only customers can access their own addresses
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden - Customer access required' }, { status: 403 })
    }

    // Find the customer record for this user
    console.log('Looking for customer with userId:', session.user.id)
    const customer = await db.customer.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    console.log('Customer found:', customer ? `ID: ${customer.id}, Name: ${customer.name}` : 'None')

    if (!customer) {
      return NextResponse.json({ 
        error: 'Customer profile not found. Please contact store owner to create your customer profile.' 
      }, { status: 404 })
    }

    // Get all addresses for this customer
    const addresses = await db.customerAddress.findMany({
      where: { customerId: customer.id },
      orderBy: [
        { isActive: 'desc' }, // Active address first
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ addresses })

  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only customers can create addresses
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden - Customer access required' }, { status: 403 })
    }

    // Find the customer record for this user
    const customer = await db.customer.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, fullName, phone, address, city, state, pincode, setAsActive } = body

    // Validation
    if (!title || !fullName || !phone || !address || !city || !state || !pincode) {
      return NextResponse.json({ 
        error: 'All fields are required: title, fullName, phone, address, city, state, pincode' 
      }, { status: 400 })
    }

    // Check if this is the first address or if setAsActive is true
    const existingAddresses = await db.customerAddress.count({
      where: { customerId: customer.id }
    })

    const shouldBeActive = existingAddresses === 0 || setAsActive === true

    // Use transaction to ensure only one active address
    const newAddress = await db.$transaction(async (tx) => {
      // If setting as active, deactivate all other addresses
      if (shouldBeActive) {
        await tx.customerAddress.updateMany({
          where: { customerId: customer.id, isActive: true },
          data: { isActive: false }
        })
      }

      // Create new address
      return await tx.customerAddress.create({
        data: {
          customerId: customer.id,
          title,
          fullName,
          phone,
          address,
          city,
          state,
          pincode,
          isActive: shouldBeActive
        }
      })
    })

    return NextResponse.json(newAddress)

  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 })
  }
}
