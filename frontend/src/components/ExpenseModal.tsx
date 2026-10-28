import React, { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import type { Expense, ExpenseCategory } from '../types'
import { createExpense, updateExpense } from '../lib/api'

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Expense | null
}

const CATEGORIES: Array<{ key: ExpenseCategory; label: string }> = [
  { key: 'convenience_food', label: 'Convenience Food' },
  { key: 'groceries', label: 'Groceries' },
  { key: 'transport', label: 'Transport' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'bills', label: 'Bills & Utilities' },
  { key: 'other', label: 'Other' },
]

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [amount, setAmount] = useState<string>(
    initialData ? initialData.amount.toString() : ''
  )
  const [category, setCategory] = useState<ExpenseCategory>(
    initialData ? initialData.category : 'convenience_food'
  )
  const [date, setDate] = useState<string>(
    initialData ? initialData.date : new Date().toISOString().slice(0, 10)
  )
  const [description, setDescription] = useState<string>(
    initialData?.description || ''
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number greater than zero.')
      return
    }

    if (!date) {
      setError('Date is required.')
      return
    }

    setIsSubmitting(true)
    try {
      if (initialData) {
        await updateExpense(initialData.id, {
          amount: Math.round(numAmount * 100) / 100,
          category,
          date,
          description: description.trim() || undefined,
        })
      } else {
        await createExpense({
          amount: Math.round(numAmount * 100) / 100,
          category,
          date,
          description: description.trim() || undefined,
        })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save expense.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl w-full max-w-md shadow-2xl p-7 relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white mb-1">
          {initialData ? 'Edit Expense' : 'Quick Add Expense'}
        </h3>
        <p className="text-xs text-zinc-500 mb-6">
          Log everyday spending to continuously calibrate your behavioral model.
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Amount (INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-zinc-400 text-base font-bold font-mono">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="450.00"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Category *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-glow-emerald-sm scale-[1.02]'
                        : 'bg-zinc-50 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Swiggy quick delivery"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold shadow-glow-emerald-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
