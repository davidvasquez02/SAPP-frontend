import { createContext, useCallback, useMemo, useState } from 'react'
import { consultaInfoAspirante } from '../../api/aspiranteAuthService'
import { mapAspiranteInfoToSession } from '../../api/aspiranteAuthMappers'
import { clearSession, getSession, saveSession } from '../../modules/auth/session/sessionStore'
import type { AspiranteLoginParams, AuthContextValue, AuthSession } from './types'

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSessionState] = useState<AuthSession | null>(() => getSession())

  const loginAspirante = useCallback(async (params: AspiranteLoginParams) => {
    const info = await consultaInfoAspirante(params)
    const authenticatedSession = mapAspiranteInfoToSession(info)
    setSessionState(authenticatedSession)
    saveSession(authenticatedSession)
  }, [])

  const logout = useCallback(() => {
    setSessionState(null)
    clearSession()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      isAuthenticated: Boolean(session),
      loginAspirante,
      logout,
    }),
    [session, loginAspirante, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
