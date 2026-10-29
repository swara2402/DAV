import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, FlaskConical, Mail, LockKeyhole, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseAuthConfigured } from '../lib/supabaseAuth'

type DemoPersona = 'maya' | 'arjun' | 'fresh'
type AuthView = 'signin' | 'signup' | 'recover' | 'reset'

export const Auth: React.FC = () => {
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<DemoPersona | 'auth' | null>(null)
  const [view, setView] = useState<AuthView>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null)
  const { loginDemo, signIn, signUp, requestPasswordReset, completePasswordRecovery, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const authConfigured = isSupabaseAuthConfigured()

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const token = params.get('access_token')
    if (params.get('type') === 'recovery' && token) {
      setRecoveryToken(token)
      setView('reset')
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }
  }, [])

  const handleDemoSignIn = async (persona: DemoPersona) => {
    setError(null)
    setNotice(null)
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (!authConfigured) {
      setError('Authentication is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the frontend environment.')
      return
    }

    if (view === 'signup' && password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    setIsSubmitting('auth')
    try {
      if (view === 'signin') {
        await signIn(email, password)
        navigate('/dashboard')
      } else if (view === 'signup') {
        const result = await signUp(email, password)
        if (result.requiresEmailConfirmation) {
          setNotice('Your account has been created. Check your inbox for a confirmation link before signing in.')
          setView('signin')
          setPassword('')
          setConfirmPassword('')
        } else {
          navigate('/dashboard')
        }
      } else if (view === 'recover') {
        await requestPasswordReset(email)
        setNotice('If an account exists for that email, a password reset link will arrive shortly.')
        setView('signin')
        setPassword('')
      } else if (view === 'reset' && recoveryToken) {
        await completePasswordRecovery(recoveryToken, password)
        setRecoveryToken(null)
        setPassword('')
        setConfirmPassword('')
        setView('signin')
        setNotice('Your password has been updated. Sign in with your new password.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.')
    } finally {
      setIsSubmitting(null)
    }
  }

  const switchView = (next: AuthView) => {
    setError(null)
    setNotice(null)
    setPassword('')
    setConfirmPassword('')
    setView(next)
  }

  const title = view === 'signup' ? 'Create your account'
    : view === 'recover' ? 'Reset your password'
      : view === 'reset' ? 'Choose a new password'
        : 'Welcome back'

  const description = view === 'signup' ? 'Create a private space for your routines and finances.'
    : view === 'recover' ? 'We will send a secure reset link if the account exists.'
      : view === 'reset' ? 'Use a strong password you have not used elsewhere.'
        : 'Sign in to continue where you left off.'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBFBFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-200">
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/[0.08] blur-3xl pointer-events-none" />

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-base shadow-glow-emerald-sm group-hover:scale-105 transition-transform">LD</span>
          <span className="font-extrabold text-2xl tracking-tight text-zinc-950 dark:text-white">Life, Decoded</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          {isDemoMode ? 'Explore Life, Decoded' : title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {isDemoMode ? 'Discover what everyday routines might be costing you.' : description}
        </p>
      </div>

      {isDemoMode ? (
        <section aria-labelledby="demo-title" className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-[#141416] p-7 sm:p-10 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-premium space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-3 w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Sparkles aria-hidden="true" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 id="demo-title" className="text-base font-bold text-zinc-900 dark:text-white">Choose a demo workspace</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No email or password needed. Explore the app using fictional sample data.</p>
            </div>
            {error && <div role="alert" className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">{error}</div>}
            <div className="grid gap-3">
              <button type="button" disabled={isSubmitting !== null} onClick={() => void handleDemoSignIn('maya')} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold transition">
                <span>Explore Maya's workspace</span><span>{isSubmitting === 'maya' ? 'Starting…' : '→'}</span>
              </button>
              <button type="button" disabled={isSubmitting !== null} onClick={() => void handleDemoSignIn('arjun')} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 disabled:opacity-60 text-white dark:text-zinc-950 text-sm font-bold transition">
                <span>Explore Arjun's workspace</span><span>{isSubmitting === 'arjun' ? 'Starting…' : '→'}</span>
              </button>
              <button type="button" disabled={isSubmitting !== null} onClick={() => void handleDemoSignIn('fresh')} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-60 text-sm font-bold transition">
                <span className="flex items-center gap-2"><FlaskConical aria-hidden="true" className="w-4 h-4" /> Start with a fresh workspace</span><span>{isSubmitting === 'fresh' ? 'Starting…' : '→'}</span>
              </button>
            </div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
              <strong>Demo only:</strong> these personas are shared sample identities, not private accounts. Do not enter real financial or personal information.
            </div>
          </div>
        </section>
      ) : (
        <section aria-label="Account authentication" className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-[#141416] p-7 sm:p-9 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-premium space-y-6">
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 gap-1">
              <button type="button" onClick={() => switchView('signin')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${view === 'signin' || view === 'recover' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-950 dark:text-white' : 'text-zinc-500'}`}>Sign in</button>
              <button type="button" onClick={() => switchView('signup')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${view === 'signup' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-950 dark:text-white' : 'text-zinc-500'}`}>Create account</button>
            </div>

            {error && <div role="alert" className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-700 dark:text-rose-300">{error}</div>}
            {notice && <div role="status" className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-800 dark:text-emerald-300">{notice}</div>}

            {!authConfigured && (
              <div role="status" className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-800 dark:text-amber-200">
                Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to the frontend environment to enable accounts.
              </div>
            )}

            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              {view !== 'reset' && (
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Email address</span>
                  <span className="relative block">
                    <Mail aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" />
                  </span>
                </label>
              )}

              {view !== 'recover' && (
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{view === 'reset' ? 'New password' : 'Password'}</span>
                  <span className="relative block">
                    <LockKeyhole aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input autoComplete={view === 'signin' ? 'current-password' : 'new-password'} type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={view === 'signin' ? 'Your password' : 'At least 8 characters'} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-11 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" />
                    <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                      {showPassword ? <EyeOff aria-hidden="true" className="w-4 h-4" /> : <Eye aria-hidden="true" className="w-4 h-4" />}
                    </button>
                  </span>
                </label>
              )}

              {(view === 'signup' || view === 'reset') && (
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Confirm password</span>
                  <input autoComplete="new-password" type={showPassword ? 'text' : 'password'} required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter password again" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" />
                </label>
              )}

              {view === 'signin' && (
                <div className="text-right">
                  <button type="button" onClick={() => switchView('recover')} className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">Forgot password?</button>
                </div>
              )}

              <button type="submit" disabled={isSubmitting !== null || !authConfigured} className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3.5 text-sm font-bold transition">
                {isSubmitting === 'auth' ? 'Please wait…' : view === 'signup' ? 'Create account' : view === 'recover' ? 'Send reset link' : view === 'reset' ? 'Update password' : 'Sign in'}
                {isSubmitting !== 'auth' && <ArrowRight aria-hidden="true" className="w-4 h-4" />}
              </button>
            </form>

            {(view === 'recover' || view === 'reset') && (
              <button type="button" onClick={() => switchView('signin')} className="w-full text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">Back to sign in</button>
            )}

            <p className="text-center text-xs leading-relaxed text-zinc-500">Your account is protected by Supabase authentication. Never share your password or verification links.</p>
          </div>
        </section>
      )}
    </main>
  )
}
