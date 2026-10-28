import { describe, it, expect } from 'vitest'
import { formatINR, formatINRPrecise, formatDate, formatCategoryName, cn } from '../lib/utils'

describe('Frontend Utility Functions', () => {
  it('formats INR whole currency values accurately', () => {
    expect(formatINR(0)).toMatch(/₹0/)
    expect(formatINR(1200)).toMatch(/₹1,200/)
    expect(formatINR(45000)).toMatch(/₹45,000/)
    expect(formatINR(null)).toBe('₹0')
    expect(formatINR(undefined)).toBe('₹0')
  })

  it('formats INR precise currency values with 2 decimal places', () => {
    expect(formatINRPrecise(1234.56)).toMatch(/₹1,234\.56/)
    expect(formatINRPrecise(0)).toMatch(/₹0\.00/)
    expect(formatINRPrecise(null)).toBe('₹0.00')
  })

  it('formats ISO dates into readable human strings', () => {
    expect(formatDate('2026-08-03')).toBe('3 Aug 2026')
    expect(formatDate('2026-10-25')).toBe('25 Oct 2026')
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
  })

  it('formats category keys into human-readable labels', () => {
    expect(formatCategoryName('convenience_food')).toBe('Convenience Food')
    expect(formatCategoryName('groceries')).toBe('Groceries')
  })

  it('merges tailwind class names properly', () => {
    expect(cn('p-4', 'bg-white', false && 'hidden')).toBe('p-4 bg-white')
    expect(cn('text-red-500', 'text-green-500')).toBe('text-green-500')
  })
})

