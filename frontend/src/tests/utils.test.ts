import { describe, it, expect } from 'vitest'
import { formatINR, formatINRPrecise, formatDate, formatCategoryName, cn, toLocalISODate, getLocalDateRange } from '../lib/utils'

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



describe('Local calendar date helpers', () => {
  it('formats date using local calendar fields rather than UTC', () => {
    const localDate = new Date(2026, 9, 29, 1, 15, 0)
    expect(toLocalISODate(localDate)).toBe('2026-10-29')
  })

  it('returns stable inclusive local date bounds', () => {
    const now = new Date(2026, 9, 29, 1, 15, 0)
    expect(getLocalDateRange(14, now)).toEqual({
      start: '2026-10-15',
      end: '2026-10-29',
    })
  })

  it('does not move the start date forward for negative ranges', () => {
    const now = new Date(2026, 9, 29, 1, 15, 0)
    expect(getLocalDateRange(-5, now)).toEqual({
      start: '2026-10-29',
      end: '2026-10-29',
    })
  })
})
