import { Store, Order, OrderItem } from '@prisma/client'
import { formatCurrency } from './money'

type OrderWithItems = Order & {
  items: (OrderItem & {
    product: {
      title: string
    }
  })[]
}

export function generateWhatsAppDeepLink(
  store: Store,
  order: OrderWithItems
): string {
  const baseUrl = 'https://wa.me/'
  const phoneNumber = store.whatsapp || ''
  
  const message = generateOrderMessage(store, order)
  
  if (phoneNumber) {
    return `${baseUrl}${phoneNumber}?text=${encodeURIComponent(message)}`
  }
  
  return `${baseUrl}?text=${encodeURIComponent(message)}`
}

function generateOrderMessage(store: Store, order: OrderWithItems): string {
  const lines = [
    `🛍️ *${store.name}* - Order #${order.id}`,
    '',
    `👤 *Customer:* ${order.buyerName}`,
    `📱 *Phone:* ${order.phone}`,
    `💳 *Payment:* ${order.paymentMethod}`,
    `📊 *Status:* ${order.status}`,
    '',
    '📦 *Order Items:*',
  ]
  
  order.items.forEach((item) => {
    const total = item.qty * decimalToNumber(item.priceSnap)
    lines.push(`• ${item.product.title} x${item.qty} — ${formatCurrency(total)}`)
  })
  
  lines.push('')
  lines.push(`💰 *Total:* ${formatCurrency(order.totalAmount)}`)
  lines.push('')
  lines.push(`📍 *Delivery Address:*`)
  lines.push(order.address ?? 'No address provided')
  lines.push('')
  
  // Check if this is a COD order that needs confirmation
  const isAwaitingConfirmation = order.status === 'AWAITING_CONFIRMATION' || 
    (order.status === 'PENDING' && order.paymentMethod === 'COD')
    
  if (isAwaitingConfirmation) {
    lines.push('⚠️ *ACTION REQUIRED:*')
    lines.push('This COD order needs your confirmation.')
    lines.push('Please check stock availability and confirm.')
    lines.push('')
    lines.push('✅ Reply "CONFIRM" to approve')
    lines.push('❌ Reply "REJECT" to decline')
  } else {
    lines.push('Please confirm this order. Thank you! 🙏')
  }
  
  return lines.join('\n')
}

export function generateOrderConfirmationRequest(
  store: Store,
  order: OrderWithItems
): string {
  const baseUrl = 'https://wa.me/'
  const phoneNumber = store.whatsapp || ''
  
  const message = generateOrderMessage(store, order)
  
  if (phoneNumber) {
    return `${baseUrl}${phoneNumber}?text=${encodeURIComponent(message)}`
  }
  
  return `${baseUrl}?text=${encodeURIComponent(message)}`
}

