import React, { createContext, useContext, useEffect, useState } from 'react'
import type { PersonaType } from '../types'
import { createPersonalSession, selectPersona } from '../lib/api'

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
  loginDemo: (persona: PersonaType) => Promise<void>
  logout: () => void
  activePersona: PersonaType | null
  setActivePersona: (persona: PersonaType) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const VALID_PERSONAS: PersonaType[] = ['maya', 'arjun', 'fresh']

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [activePersona, setActivePersonaState] = useState<PersonaType | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('ld_auth_token')
    const savedPersona = localStorage.getItem('ld_active_persona') as PersonaType | null
    const privateUserId = localStorage.getItem('ld_private_user_id')
    const isPrivateSession = savedPersona === 'fresh'
      && !!token
      && !!privateUserId
      && /^demo_session_[0-9a-f-]{36}$/.test(privateUserId)

    if (isPrivateSession) {
      setUser({
        user_id: privateUserId!,
        email: 'personal@demo.lifedecoded.app',
        persona: 'fresh',
        is_demo: true,
      })
      setActivePersonaState('fresh')
    } else if (token && token === `demo_${savedPersona}` && savedPersona && VALID_PERSONAS.includes(savedPersona) && savedPersona !== 'fresh') {
      setUser({
        user_id: token,
        email: `${savedPersona}@demo.lifedecoded.app`,
        persona: savedPersona,
        is_demo: true,
      })
      setActivePersonaState(savedPersona)
    } else {
      localStorage.removeItem('ld_auth_token')
      localStorage.removeItem('ld_active_persona')
      localStorage.removeItem('ld_private_user_id')
    }
    setIsLoading(false)
  }, [])

  const loginDemo = async (persona: PersonaType) => {
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
        const session = await createPersonalSession()
        token = session.access_token
        userId = session.user_id
        email = session.email
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
      setUser({ user_id: userId, email, persona, is_demo: true })
      setActivePersonaState(persona)
    } catch (err) {
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

  const logout = () => {
    localStorage.removeItem('ld_auth_token')
    localStorage.removeItem('ld_active_persona')
    localStorage.removeItem('ld_private_user_id')
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
        loginDemo,
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
