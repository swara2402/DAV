import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Moon,
  Sun,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { resetDemo } from '../lib/api'

export const Settings: React.FC = () => {
  const { user, activePersona } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false)
  const [resetting, setResetting] = useState<boolean>(false)
  const [resetSuccess, setResetSuccess] = useState<boolean>(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const handleResetData = async () => {
    setResetting(true)
    setResetError(null)
    try {
      await resetDemo()
      setResetSuccess(true)
      setShowConfirmReset(false)
      setTimeout(() => {
        navigate('/persona')
      }, 1500)
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset workspace data.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Workspace Settings
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Manage your persona, theme preferences, and demo data lifecycle.
          </p>
        </div>

        {resetSuccess && (
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-xs text-green-800 dark:text-green-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Workspace data cleared. Redirecting to persona selection...</span>
          </div>
        )}

        {/* Profile / Persona Info */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-green-600" />
            <span>Profile &amp; Session</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-stone-500">Authenticated Identity</span>
              <div className="font-mono mt-0.5">{user?.user_id || 'demo_user'}</div>
            </div>
            <div>
              <span className="text-stone-500">Email Address</span>
              <div className="font-mono mt-0.5">{user?.email || 'user@lifedecoded.app'}</div>
            </div>
            <div>
              <span className="text-stone-500">Active Persona</span>
              <div className="font-semibold text-stone-800 dark:text-stone-200 capitalize mt-0.5">
                {activePersona || 'fresh'}
              </div>
            </div>
            <div>
              <span className="text-stone-500">Environment</span>
              <div className="font-medium mt-0.5">Local Development / Demo Mode</div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>Appearance Theme</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Currently using {theme === 'dark' ? 'Refined Dark' : 'Warm Off-White'} mode.
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        {/* Demo Data Reset Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border border-red-200/80 dark:border-red-900/60 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Reset Workspace Data</span>
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
              Permanently clears all seeded or manually entered expenses, tasks, actions, and calculation
              snapshots associated with this session. Allows you to start fresh or re-seed Maya and Arjun.
            </p>
          </div>

          {resetError && (
            <div className="p-3 rounded-lg bg-red-50 text-xs text-red-600">
              {resetError}
            </div>
          )}

          {showConfirmReset ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-800 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Confirm Workspace Data Deletion</span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-400">
                Are you sure you want to delete all records for this session? This action cannot be undone.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetData}
                  disabled={resetting}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {resetting ? 'Deleting...' : 'Yes, Delete All Records'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition"
            >
              Reset Session Data
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
