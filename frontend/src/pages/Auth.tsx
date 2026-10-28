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

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please provide both email and password.')
      return
    }
    // In local demo mode, create user workspace session
    localStorage.setItem('ld_auth_token', `demo_fresh`)
    localStorage.setItem('ld_active_persona', 'fresh')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0F0F0E] text-stone-900 dark:text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            LD
          </div>
          <span className="font-semibold text-xl tracking-tight">Life, Decoded</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">
          {tab === 'signin' ? 'Sign in to your account' : 'Create your workspace'}
        </h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Discover patterns in your daily responsibilities and spending
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#1A1A19] py-8 px-6 sm:px-10 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl space-y-6">
          {/* Quick Demo Mode Section */}
          <div className="p-4 rounded-xl bg-green-50/70 dark:bg-green-950/30 border border-green-200 dark:border-green-900/60 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-800 dark:text-green-300 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Demo Access</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 mb-3">
              No account or password needed to evaluate the Insight Engine.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('maya')}
                className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition shadow-sm"
              >
                Launch Maya (23)
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('arjun')}
                className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium transition shadow-sm"
              >
                Launch Arjun (25)
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#1A1A19] px-2 text-stone-400 font-medium">
                Or Continue With Email
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium transition"
            >
              {tab === 'signin' ? 'Sign In to Workspace' : 'Create Free Account'}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1 text-xs text-stone-500">
            <span>{tab === 'signin' ? "Don't have an account?" : 'Already registered?'}</span>
            <button
              type="button"
              onClick={() => {
                setTab(tab === 'signin' ? 'signup' : 'signin')
                setError(null)
              }}
              className="text-green-600 dark:text-green-400 font-medium hover:underline"
            >
              {tab === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
