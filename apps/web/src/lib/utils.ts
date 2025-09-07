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
