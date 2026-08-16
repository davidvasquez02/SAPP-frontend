import { useCallback, useMemo, useState } from 'react'
import { login as loginService } from '../../api/authService'
import { mapLoginToUserSession } from '../../api/authMappers'
import { consultaInfoAspirante } from '../../api/aspiranteAuthService'
import { mapAspiranteInfoToSession } from '../../api/aspiranteAuthMappers'
import { clearSession, getSession, saveSession } from '../../modules/auth/session/sessionStore'
import { ENABLE_GATEWAY_AUTH_MOCK, getMockGatewayAdminSession } from './mockGatewaySession'
import { AuthContext } from './context'
import type { AspiranteLoginParams, AuthContextValue, AuthSession } from './types'

const getInitialSession = () => {
  if (ENABLE_GATEWAY_AUTH_MOCK) {
    const mockSession = getMockGatewayAdminSession()
    saveSession(mockSession)
    return mockSession
  }

  const storedSession = getSession()
  const isExpired =
    storedSession?.kind === 'SAPP' && storedSession.expiresAt
      ? Math.floor(Date.now() / 1000) >= storedSession.expiresAt
      : false

  if (isExpired) {
    clearSession()
    return null
  }

  return storedSession
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSessionState] = useState<AuthSession | null>(() => getInitialSession())

  const login = useCallback(async (username: string, password: string) => {
    const loginDto = await loginService(username, password)
    const authenticatedSession = mapLoginToUserSession(loginDto)
    setSessionState(authenticatedSession)
    saveSession(authenticatedSession)
  }, [])

  const loginAspirante = useCallback(async (params: AspiranteLoginParams) => {
    const info = await consultaInfoAspirante(params)
    const authenticatedSession = mapAspiranteInfoToSession(info)
    setSessionState(authenticatedSession)
    saveSession(authenticatedSession)
  }, [])

  const logout = useCallback(() => {
    clearSession()

    if (ENABLE_GATEWAY_AUTH_MOCK) {
      const mockSession = getMockGatewayAdminSession()
      setSessionState(mockSession)
      saveSession(mockSession)
      return
    }

    setSessionState(null)
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
