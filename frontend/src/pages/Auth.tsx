import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const Auth: React.FC = () => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { loginDemo } = useAuth()
  const navigate = useNavigate()

  const handleDemoSignIn = async (persona: 'maya' | 'arjun' | 'fresh') => {
    try {
      await loginDemo(persona)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate demo session.')
    }
  }

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please provide both email and password.')
      return
    }
    try {
      await loginDemo('fresh')
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to initialize session.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-200">
      {/* Glow background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/[0.08] blur-3xl pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-base shadow-glow-emerald-sm group-hover:scale-105 transition-transform">
            LD
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-zinc-950 dark:text-white">Life, Decoded</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          {tab === 'signin' ? 'Sign in to your account' : 'Create your workspace'}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-500">
          Discover what your everyday routines might be costing you
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#141416] py-9 px-7 sm:px-10 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-premium space-y-6">
          {/* Quick Demo Mode Section */}
          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1.5 uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Instant Demo Evaluation</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
              Explore the insight calculation engine without creating credentials.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoSignIn('maya')}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold shadow-glow-emerald-sm transition cursor-pointer"
              >
                Launch Maya (23)
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('arjun')}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold shadow-subtle transition cursor-pointer"
              >
                Launch Arjun (25)
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#141416] px-3 text-zinc-400 font-semibold text-[10px] tracking-wider">
                Or Enter Email
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold shadow-subtle transition cursor-pointer active:scale-[0.98]"
            >
              {tab === 'signin' ? 'Sign In to Workspace' : 'Create Free Workspace'}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 pt-1">
            <span>{tab === 'signin' ? "Don't have an account?" : 'Already registered?'}</span>
            <button
              type="button"
              onClick={() => {
                setTab(tab === 'signin' ? 'signup' : 'signin')
                setError(null)
              }}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {tab === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
