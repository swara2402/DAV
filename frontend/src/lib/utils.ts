import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0'
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount)
  return `₹${formatted}`
}

export function formatINRPrecise(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00'
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `₹${formatted}`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const parts = dateStr.slice(0, 10).split('-')
    if (parts.length === 3) {
      const year = parts[0]
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ]
      const month = monthNames[parseInt(parts[1], 10) - 1] || parts[1]
      const day = parseInt(parts[2], 10)
      return `${day} ${month} ${year}`
    }
    return dateStr
  } catch {
    return dateStr
  }
}

export function formatCategoryName(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}


/**
 * Format a calendar date using local calendar fields, not UTC.
 * toISOString() can shift the displayed day for users in time zones ahead of UTC.
 */
export function toLocalISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Return inclusive API date bounds for a period ending on the local calendar day. */
export function getLocalDateRange(days: number, now: Date = new Date()): {
  start: string
  end: string
} {
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - Math.max(0, Math.floor(days)))
  return {
    start: toLocalISODate(startDate),
    end: toLocalISODate(endDate),
  }
}
