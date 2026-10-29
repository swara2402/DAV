import React, { createContext, useContext, useEffect, useState } from 'react'
import type { PersonaType } from '../types'
import { createPersonalSession, selectPersona } from '../lib/api'
import {
  getSupabaseUser,
  refreshSupabaseSession,
  sendPasswordReset,
  signInWithEmail,
  signOutSupabase,
  signUpWithEmail,
  updateSupabasePassword,
  type SupabaseSession,
} from '../lib/supabaseAuth'

interface AuthUser {
  user_id: string
  email: string
  persona?: PersonaType
  is_demo: boolean
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isDemoMode: boolean
  loginDemo: (persona: PersonaType) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>
  requestPasswordReset: (email: string) => Promise<void>
  completePasswordRecovery: (accessToken: string, password: string) => Promise<void>
  logout: () => void
  activePersona: PersonaType | null
  setActivePersona: (persona: PersonaType) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const VALID_PERSONAS: PersonaType[] = ['maya', 'arjun', 'fresh']
const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false'
const SESSION_KEY = 'ld_supabase_session'

function saveSession(session: SupabaseSession): void {
  const normalized = {
    ...session,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(normalized))
  localStorage.setItem('ld_auth_token', normalized.access_token)
}

function clearRealSession(): void {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('ld_auth_token')
  localStorage.removeItem('ld_active_persona')
  localStorage.removeItem('ld_private_user_id')
}

function toAuthUser(user: { id: string; email?: string }): AuthUser {
  return {
    user_id: user.id,
    email: user.email || '',
    is_demo: false,
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [activePersona, setActivePersonaState] = useState<PersonaType | null>(null)
  const [session, setSession] = useState<SupabaseSession | null>(null)

  useEffect(() => {
    let mounted = true

    const restore = async () => {
      if (isDemoMode) {
        const token = localStorage.getItem('ld_auth_token')
        const savedPersona = localStorage.getItem('ld_active_persona') as PersonaType | null
        const privateUserId = localStorage.getItem('ld_private_user_id')
        const isPrivateSession = savedPersona === 'fresh'
          && !!token
          && !!privateUserId
          && /^demo_session_[0-9a-f-]{36}$/.test(privateUserId)

        if (isPrivateSession) {
          setUser({ user_id: privateUserId!, email: 'personal@demo.lifedecoded.app', persona: 'fresh', is_demo: true })
          setActivePersonaState('fresh')
        } else if (token && token === `demo_${savedPersona}` && savedPersona && VALID_PERSONAS.includes(savedPersona) && savedPersona !== 'fresh') {
          setUser({ user_id: token, email: `${savedPersona}@demo.lifedecoded.app`, persona: savedPersona, is_demo: true })
          setActivePersonaState(savedPersona)
        } else {
          localStorage.removeItem('ld_auth_token')
          localStorage.removeItem('ld_active_persona')
          localStorage.removeItem('ld_private_user_id')
        }
        setIsLoading(false)
        return
      }

      try {
        const saved = localStorage.getItem(SESSION_KEY)
        if (!saved) {
          clearRealSession()
          return
        }
        let current = JSON.parse(saved) as SupabaseSession
        if (!current.refresh_token || !current.access_token) {
          clearRealSession()
          return
        }
        if (!current.expires_at || current.expires_at <= Math.floor(Date.now() / 1000) + 90) {
          current = await refreshSupabaseSession(current.refresh_token)
        }
        const verifiedUser = await getSupabaseUser(current.access_token)
        if (!mounted) return
        current.user = verifiedUser
        saveSession(current)
        setSession(current)
        setUser(toAuthUser(verifiedUser))
      } catch {
        clearRealSession()
        if (mounted) {
          setSession(null)
          setUser(null)
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void restore()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (isDemoMode || !session?.refresh_token) return
    const timer = window.setInterval(() => {
      const expiresAt = session.expires_at ?? 0
      if (expiresAt <= Math.floor(Date.now() / 1000) + 120) {
        void refreshSupabaseSession(session.refresh_token)
          .then((nextSession) => {
            saveSession(nextSession)
            setSession(nextSession)
            setUser(toAuthUser(nextSession.user))
          })
          .catch(() => {
            clearRealSession()
            setSession(null)
            setUser(null)
          })
      }
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [session])

  const loginDemo = async (persona: PersonaType) => {
    if (!isDemoMode) throw new Error('Demo workspaces are disabled. Please sign in with your account.')
    if (!VALID_PERSONAS.includes(persona)) {
      throw new Error('Unknown workspace. Please choose one of the available options.')
    }

    const previousToken = localStorage.getItem('ld_auth_token')
    const previousPersona = localStorage.getItem('ld_active_persona')
    const previousPrivateUserId = localStorage.getItem('ld_private_user_id')
    const previousUser = user
    const previousActivePersona = activePersona

    setIsLoading(true)
    try {
      let token: string
      let userId: string
      let email: string
      if (persona === 'fresh') {
        const freshSession = await createPersonalSession()
        token = freshSession.access_token
        userId = freshSession.user_id
        email = freshSession.email
        localStorage.setItem('ld_private_user_id', userId)
      } else {
        token = `demo_${persona}`
        userId = token
        email = `${persona}@demo.lifedecoded.app`
        localStorage.removeItem('ld_private_user_id')
        localStorage.setItem('ld_auth_token', token)
        await selectPersona(persona)
      }
      localStorage.setItem('ld_auth_token', token)
      localStorage.setItem('ld_active_persona', persona)
      setSession(null)
      localStorage.removeItem(SESSION_KEY)
      setUser({ user_id: userId, email, persona, is_demo: true })
      setActivePersonaState(persona)
    } catch {
      if (previousToken === null) localStorage.removeItem('ld_auth_token')
      else localStorage.setItem('ld_auth_token', previousToken)
      if (previousPersona === null) localStorage.removeItem('ld_active_persona')
      else localStorage.setItem('ld_active_persona', previousPersona)
      if (previousPrivateUserId === null) localStorage.removeItem('ld_private_user_id')
      else localStorage.setItem('ld_private_user_id', previousPrivateUserId)
      setUser(previousUser)
      setActivePersonaState(previousActivePersona)
      throw new Error('Could not start the workspace. Make sure the backend is running, then try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const nextSession = await signInWithEmail(email.trim(), password)
      const verifiedUser = await getSupabaseUser(nextSession.access_token)
      nextSession.user = verifiedUser
      saveSession(nextSession)
      setSession(nextSession)
      setUser(toAuthUser(verifiedUser))
      setActivePersonaState(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await signUpWithEmail(email.trim(), password)
      if (result.session) {
        const verifiedUser = await getSupabaseUser(result.session.access_token)
        result.session.user = verifiedUser
        saveSession(result.session)
        setSession(result.session)
        setUser(toAuthUser(verifiedUser))
        setActivePersonaState(null)
      }
      return { requiresEmailConfirmation: !result.session }
    } finally {
      setIsLoading(false)
    }
  }

  const requestPasswordReset = async (email: string) => {
    await sendPasswordReset(email.trim())
  }

  const completePasswordRecovery = async (accessToken: string, password: string) => {
    await updateSupabasePassword(accessToken, password)
  }

  const logout = () => {
    const token = session?.access_token
    if (token) void signOutSupabase(token).catch(() => undefined)
    clearRealSession()
    localStorage.removeItem('ld_active_persona')
    localStorage.removeItem('ld_private_user_id')
    setSession(null)
    setUser(null)
    setActivePersonaState(null)
  }

  const setActivePersona = (persona: PersonaType) => {
    void loginDemo(persona).catch((error: unknown) => {
      console.error('Failed to switch demo persona:', error)
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isDemoMode,
        loginDemo,
        signIn,
        signUp,
        requestPasswordReset,
        completePasswordRecovery,
        logout,
        activePersona,
        setActivePersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
