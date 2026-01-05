import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginMock } from '../../api/auth'
import type { AuthContextValue, AuthUser } from './types'

const AUTH_STORAGE_KEY = 'sapp.auth.session'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedSession = localStorage.getItem(AUTH_STORAGE_KEY)
    if (storedSession) {
      try {
        const parsedUser = JSON.parse(storedSession) as AuthUser
        setUser(parsedUser)
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const authenticatedUser = await loginMock({ username, password })
    setUser(authenticatedUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
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
