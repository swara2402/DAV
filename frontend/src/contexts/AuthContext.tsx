import React, { createContext, useContext, useEffect, useState } from 'react'
import type { PersonaType } from '../types'
import { selectPersona } from '../lib/api'

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

    // Only restore known demo identities. Never trust arbitrary localStorage values.
    if (token && token === `demo_${savedPersona}` && savedPersona && VALID_PERSONAS.includes(savedPersona)) {
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
    }
    setIsLoading(false)
  }, [])

  const loginDemo = async (persona: PersonaType) => {
    if (!VALID_PERSONAS.includes(persona)) {
      throw new Error('Unknown demo workspace. Please choose one of the available personas.')
    }

    const previousToken = localStorage.getItem('ld_auth_token')
    const previousPersona = localStorage.getItem('ld_active_persona')
    const previousUser = user
    const previousActivePersona = activePersona

    setIsLoading(true)
    const token = `demo_${persona}`
    // The demo endpoint expects this bearer token. Roll it back if the backend fails.
    localStorage.setItem('ld_auth_token', token)
    localStorage.setItem('ld_active_persona', persona)

    try {
      await selectPersona(persona)
      const nextUser: AuthUser = {
        user_id: token,
        email: `${persona}@demo.lifedecoded.app`,
        persona,
        is_demo: true,
      }
      setUser(nextUser)
      setActivePersonaState(persona)
    } catch (err) {
      if (previousToken === null) localStorage.removeItem('ld_auth_token')
      else localStorage.setItem('ld_auth_token', previousToken)
      if (previousPersona === null) localStorage.removeItem('ld_active_persona')
      else localStorage.setItem('ld_active_persona', previousPersona)
      setUser(previousUser)
      setActivePersonaState(previousActivePersona)
      throw new Error('Could not start the demo workspace. Make sure the backend is running, then try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('ld_auth_token')
    localStorage.removeItem('ld_active_persona')
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
