import { createContext, useCallback, useMemo, useState } from 'react'
import { login as loginService } from '../../api/authService'
import { loginAspirante as loginAspiranteService } from '../../api/aspiranteAuthService'
import * as AuthStorage from './AuthStorage'
import type { AspiranteLoginParams, AuthContextValue, AuthSession } from './types'

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSessionState] = useState<AuthSession | null>(() => AuthStorage.getSession())

  const login = useCallback(async (username: string, password: string) => {
    const authenticatedSession = await loginService(username, password)
    setSessionState(authenticatedSession)
    AuthStorage.setSession(authenticatedSession)
  }, [])

  const loginAspirante = useCallback(async (params: AspiranteLoginParams) => {
    const authenticatedSession = await loginAspiranteService(params)
    setSessionState(authenticatedSession)
    AuthStorage.setSession(authenticatedSession)
  }, [])

  const logout = useCallback(() => {
    setSessionState(null)
    AuthStorage.clearSession()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      login,
      loginAspirante,
      logout,
    }),
    [session, login, loginAspirante, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
