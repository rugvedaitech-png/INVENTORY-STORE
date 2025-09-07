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
    '',
    '📦 *Order Items:*',
  ]
  
  order.items.forEach((item) => {
    const total = item.qty * item.priceSnap
    lines.push(`• ${item.product.title} x${item.qty} — ${formatCurrency(total)}`)
  })
  
  lines.push('')
  lines.push(`💰 *Total:* ${formatCurrency(order.totalAmount)}`)
  lines.push('')
  lines.push(`📍 *Delivery Address:*`)
  lines.push(order.address)
  lines.push('')
  lines.push('Please confirm this order. Thank you! 🙏')
  
  return lines.join('\n')
}

