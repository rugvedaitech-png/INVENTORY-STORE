/**
 * Money utilities for handling paise (cents) to currency conversion
 */

export function formatCurrency(paise: number, currency = 'INR'): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees)
}

export function paiseToRupees(paise: number): number {
  return paise / 100
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

export function addPaise(a: number, b: number): number {
  return a + b
}

export function subtractPaise(a: number, b: number): number {
  return a - b
}

export function multiplyPaise(paise: number, multiplier: number): number {
  return Math.round(paise * multiplier)
}

export function dividePaise(paise: number, divisor: number): number {
  return Math.round(paise / divisor)
}

