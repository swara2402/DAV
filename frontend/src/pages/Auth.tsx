import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, FlaskConical } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type DemoPersona = 'maya' | 'arjun' | 'fresh'

export const Auth: React.FC = () => {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<DemoPersona | null>(null)
  const { loginDemo } = useAuth()
  const navigate = useNavigate()

  const handleDemoSignIn = async (persona: DemoPersona) => {
    setError(null)
    setIsSubmitting(persona)
    try {
      await loginDemo(persona)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not start the demo. Please check that the backend is running and try again.')
    } finally {
      setIsSubmitting(null)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBFBFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-200">
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/[0.08] blur-3xl pointer-events-none" />

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-base shadow-glow-emerald-sm group-hover:scale-105 transition-transform">
            LD
          </span>
          <span className="font-extrabold text-2xl tracking-tight text-zinc-950 dark:text-white">Life, Decoded</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Explore Life, Decoded
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Discover what everyday routines might be costing you.
        </p>
      </div>

      <section aria-labelledby="demo-title" className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#141416] p-7 sm:p-10 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-premium space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-3 w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Sparkles aria-hidden="true" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 id="demo-title" className="text-base font-bold text-zinc-900 dark:text-white">Choose a demo workspace</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              No email or password needed. Explore the app using fictional sample data.
            </p>
          </div>

          {error && (
            <div role="alert" className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid gap-3">
            <button
              type="button"
              disabled={isSubmitting !== null}
              onClick={() => void handleDemoSignIn('maya')}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold transition"
            >
              <span>Explore Maya's workspace</span>
              <span>{isSubmitting === 'maya' ? 'Starting…' : '→'}</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting !== null}
              onClick={() => void handleDemoSignIn('arjun')}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 disabled:opacity-60 text-white dark:text-zinc-950 text-sm font-bold transition"
            >
              <span>Explore Arjun's workspace</span>
              <span>{isSubmitting === 'arjun' ? 'Starting…' : '→'}</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting !== null}
              onClick={() => void handleDemoSignIn('fresh')}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-60 text-sm font-bold transition"
            >
              <span className="flex items-center gap-2"><FlaskConical aria-hidden="true" className="w-4 h-4" /> Start with a fresh workspace</span>
              <span>{isSubmitting === 'fresh' ? 'Starting…' : '→'}</span>
            </button>
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            <strong>Demo only:</strong> these personas are shared sample identities, not private accounts. Do not enter real financial or personal information. Changes may be visible to other demo visitors or cleared when the demo is reset.
          </div>
          <p className="text-center text-xs text-zinc-500">
            Real account registration and sign-in are not available in this version.
          </p>
        </div>
      </section>
    </main>
  )
}
