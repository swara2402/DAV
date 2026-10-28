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
      <div className="max-w-3xl mx-auto space-y-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Workspace Settings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Manage your persona, visual theme preferences, and demo data lifecycle.
          </p>
        </div>

        {resetSuccess && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-3 animate-fade-in shadow-subtle">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">Workspace data cleared. Redirecting to persona selection...</span>
          </div>
        )}

        {/* Profile / Persona Info */}
        <div className="p-7 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950 dark:text-white">Profile &amp; Session Identity</h2>
              <p className="text-xs text-zinc-500">Authenticated workspace parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Session Token</span>
              <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-1">{user?.user_id || 'demo_user'}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Email Address</span>
              <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-1">{user?.email || 'user@lifedecoded.app'}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Active Persona</span>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 capitalize mt-1 text-sm">
                {activePersona || 'fresh'}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Environment Mode</span>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 mt-1">Local Development / Demo Mode</div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="p-7 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950 dark:text-white">Appearance Theme</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Currently rendered in {theme === 'dark' ? 'Deep Obsidian Dark' : 'Warm Editorial Light'} mode.
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-subtle cursor-pointer self-start sm:self-auto"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        {/* Demo Data Reset Card */}
        <div className="p-7 rounded-3xl bg-white dark:bg-[#141416] border border-rose-500/20 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-600 dark:text-rose-400">Reset Workspace Data</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Permanently clears all seeded or manually logged expenses and tasks for this user session.
              </p>
            </div>
          </div>

          {resetError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600">
              {resetError}
            </div>
          )}

          {showConfirmReset ? (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Confirm Workspace Data Deletion</span>
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                Are you sure you want to delete all records for this session? This action cannot be undone.
              </p>
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleResetData}
                  disabled={resetting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {resetting ? 'Deleting...' : 'Yes, Delete All Records'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 transition cursor-pointer"
            >
              Reset Session Data
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
