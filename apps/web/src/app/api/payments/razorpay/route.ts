import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isRazorpayEnabled, createRazorpayOrder, verifyRazorpayPayment } from '@/lib/rzp'

export async function POST(request: NextRequest) {
  try {
    if (!isRazorpayEnabled()) {
      return NextResponse.json(
        { error: 'Razorpay is not enabled' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { orderId, amount } = body

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Order ID and amount are required' },
        { status: 400 }
      )
    }

    // Verify order exists and is pending
    const order = await db.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Order is not in pending status' },
        { status: 400 }
      )
    }

    if (order.totalAmount !== amount) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      )
    }

    const razorpayOrder = await createRazorpayOrder(amount, orderId)

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    })
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    return NextResponse.json(
      { error: 'Failed to create Razorpay order' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isRazorpayEnabled()) {
      return NextResponse.json(
        { error: 'Razorpay is not enabled' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json(
        { error: 'All payment parameters are required' },
        { status: 400 }
      )
    }

    // Verify payment signature
    const isValid = await verifyRazorpayPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Update order status to confirmed
    const order = await db.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        paymentRef: razorpay_payment_id,
      },
    })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

