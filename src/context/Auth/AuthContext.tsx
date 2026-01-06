import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginMock } from '../../api/auth'
import { clearSession, getSession, setSession } from './AuthStorage'
import type { AuthContextValue, AuthSession } from './types'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSessionState] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedSession = getSession()
    if (storedSession) {
      setSessionState(storedSession)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const authenticatedSession = await loginMock({ username, password })
    setSessionState(authenticatedSession)
    setSession(authenticatedSession)
  }, [])

  const logout = useCallback(() => {
    setSessionState(null)
    clearSession()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isAuthenticated: Boolean(session),
      isLoading,
      login,
      logout,
    }),
    [session, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
