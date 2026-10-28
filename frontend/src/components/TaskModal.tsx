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
          {initialData ? 'Edit Task' : 'Quick Add Task'}
        </h3>
        <p className="text-xs text-zinc-500 mb-6">
          Tasks and deadlines build the Sunday overdue backlog snapshot.
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish Q3 tax review"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
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

          {/* Due Date & Created Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Created Date
              </label>
              <input
                type="date"
                required
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Completion Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-700"
              />
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Mark task as completed
              </span>
            </label>
          </div>

          {isCompleted && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Completed Date *
              </label>
              <input
                type="date"
                required
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              />
            </div>
          )}

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
              {isSubmitting ? 'Saving...' : initialData ? 'Update Task' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
