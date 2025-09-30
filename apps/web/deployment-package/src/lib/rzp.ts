import Razorpay from 'razorpay'

const razorpayEnabled = process.env.RAZORPAY_ENABLED === 'true'

export const razorpay = razorpayEnabled
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  : null

export function isRazorpayEnabled(): boolean {
  return razorpayEnabled
}

export async function createRazorpayOrder(amount: number, orderId: string) {
  if (!razorpay) {
    throw new Error('Razorpay is not enabled')
  }

  const options = {
    amount: amount, // amount in paise
    currency: 'INR',
    receipt: orderId,
    notes: {
      orderId,
    },
  }

  return await razorpay.orders.create(options)
}

export async function verifyRazorpayPayment(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
) {
  if (!razorpay) {
    throw new Error('Razorpay is not enabled')
  }

  const crypto = await import('crypto')
  const body = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest('hex')

  return expectedSignature === razorpay_signature
}
