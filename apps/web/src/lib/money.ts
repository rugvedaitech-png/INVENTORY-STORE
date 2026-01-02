/**
 * Money utilities for handling currency in rupees
 */

// Type for Prisma Decimal
type Decimal = {
  toNumber(): number
  toString(): string
}

export function formatCurrency(rupees: number | string | Decimal | null | undefined, currency = 'INR'): string {
  if (rupees === null || rupees === undefined) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0)
  }
  
  const amount = typeof rupees === 'string' 
    ? parseFloat(rupees) 
    : typeof rupees === 'number'
    ? rupees
    : rupees.toNumber()
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Helper to convert Decimal to number
export function decimalToNumber(decimal: number | string | Decimal): number {
  if (typeof decimal === 'number') return decimal
  if (typeof decimal === 'string') return parseFloat(decimal)
  return decimal.toNumber()
}

// Helper to convert price from database (handles both paise and rupees)
// If price > 1000, assume it's in paise and convert to rupees
export function convertPriceToRupees(price: number | string | Decimal): number {
  const priceValue = decimalToNumber(price)
  // If price is very large (> 1000), it's likely still in paise
  // This is a temporary fix until migration is complete
  if (priceValue > 1000) {
    return priceValue / 100
  }
  return priceValue
}

// Helper to convert number to Decimal string for Prisma
export function numberToDecimal(value: number): string {
  return value.toFixed(2)
}

