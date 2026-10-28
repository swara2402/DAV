import React, { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import type { Task, TaskCategory } from '../types'
import { createTask, updateTask } from '../lib/api'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Task | null
}

const CATEGORIES: Array<{ key: TaskCategory; label: string }> = [
  { key: 'work', label: 'Work' },
  { key: 'personal', label: 'Personal' },
  { key: 'finance', label: 'Finance' },
  { key: 'household', label: 'Household' },
  { key: 'health', label: 'Health' },
  { key: 'other', label: 'Other' },
]

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10)
  const [title, setTitle] = useState<string>(initialData?.title || '')
  const [category, setCategory] = useState<TaskCategory>(
    initialData ? initialData.category : 'work'
  )
  const [dueDate, setDueDate] = useState<string>(
    initialData?.due_date || todayStr
  )
  const [createdAt, setCreatedAt] = useState<string>(
    initialData ? initialData.created_at.slice(0, 10) : todayStr
  )
  const [isCompleted, setIsCompleted] = useState<boolean>(
    Boolean(initialData?.completed_at)
  )
  const [completedAt, setCompletedAt] = useState<string>(
    initialData?.completed_at ? initialData.completed_at.slice(0, 10) : todayStr
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Task title is required.')
      return
    }

    if (dueDate && createdAt && createdAt > dueDate) {
      setError('Task creation date cannot occur after its due date.')
      return
    }

    if (isCompleted && completedAt && createdAt && completedAt < createdAt) {
      setError('Completion date cannot precede task creation date.')
      return
    }

    setIsSubmitting(true)
    try {
      if (initialData) {
        await updateTask(initialData.id, {
          title: title.trim(),
          category,
          due_date: dueDate || undefined,
          completed_at: isCompleted ? completedAt : undefined,
        })
      } else {
        await createTask({
          title: title.trim(),
          category,
          due_date: dueDate || undefined,
          completed_at: isCompleted ? completedAt : undefined,
          created_at: createdAt ? `${createdAt}T10:00:00Z` : undefined,
        })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save task.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100 mb-1">
          {initialData ? 'Edit Task' : 'Quick Add Task'}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-5">
          Tasks and their deadlines build the weekly overload snapshot.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish Q3 tax review"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-green-600 text-white border-green-600 shadow-sm'
                        : 'bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Created Date
              </label>
              <input
                type="date"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>

          {/* Completion Status */}
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-4 h-4 rounded text-green-600 focus:ring-green-600 border-stone-300"
              />
              <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
                Mark as Completed
              </span>
            </label>

            {isCompleted && (
              <div>
                <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Completion Date
                </label>
                <input
                  type="date"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Task' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
