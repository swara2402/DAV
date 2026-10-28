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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [activePersona, setActivePersonaState] = useState<PersonaType | null>(null)

  useEffect(() => {
    // Check localStorage on mount
    const token = localStorage.getItem('ld_auth_token')
    const savedPersona = localStorage.getItem('ld_active_persona') as PersonaType | null

    if (token) {
      const persona = savedPersona || (token.replace('demo_', '') as PersonaType) || 'maya'
      setUser({
        user_id: token,
        email: `${persona}@demo.lifedecoded.app`,
        persona,
        is_demo: true,
      })
      setActivePersonaState(persona)
    }
    setIsLoading(false)
  }, [])

  const loginDemo = async (persona: PersonaType) => {
    setIsLoading(true)
    const token = `demo_${persona}`
    localStorage.setItem('ld_auth_token', token)
    localStorage.setItem('ld_active_persona', persona)

    setUser({
      user_id: token,
      email: `${persona}@demo.lifedecoded.app`,
      persona,
      is_demo: true,
    })
    setActivePersonaState(persona)

    try {
      await selectPersona(persona)
    } catch (err) {
      console.error('Failed to seed persona in backend:', err)
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
    loginDemo(persona)
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

