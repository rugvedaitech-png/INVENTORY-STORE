import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to parse images JSON string
export function parseImages(imagesString: string): string[] {
  try {
    const parsed = JSON.parse(imagesString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Safe integer parsing - throws error if invalid instead of returning NaN
export function safeParseInt(value: string | number | undefined | null, defaultValue?: number): number {
  if (value === undefined || value === null) {
    if (defaultValue !== undefined) return defaultValue
    throw new Error('Value is required')
  }
  const num = typeof value === 'number' ? value : parseInt(String(value), 10)
  if (isNaN(num)) {
    if (defaultValue !== undefined) return defaultValue
    throw new Error(`Invalid integer: ${value}`)
  }
  return num
}