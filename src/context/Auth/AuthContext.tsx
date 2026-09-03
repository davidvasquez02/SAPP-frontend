import { useCallback, useEffect, useMemo, useState } from 'react'
import { loginFromGateway, logoutFromGateway } from '../../api/authService'
import { mapGatewayLoginToUserSession } from '../../api/authMappers'
import { clearSession, getSession, saveSession } from '../../modules/auth/session/sessionStore'
import { clearBrowserSession } from '../../modules/auth/session/clearBrowserSession'
import { AuthContext } from './context'
import type { AuthContextValue, AuthSession } from './types'

const getInitialSession = () => {
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
  const [isInitializing, setIsInitializing] = useState(true)
  const [initializationError, setInitializationError] = useState<string | null>(null)

  const initializeFromGateway = useCallback(async () => {
    setIsInitializing(true)
    setInitializationError(null)

    try {
      const loginDto = await loginFromGateway()
      const authenticatedSession = mapGatewayLoginToUserSession(loginDto)
      setSessionState(authenticatedSession)
      saveSession(authenticatedSession)
    } catch (error) {
      clearSession()
      setSessionState(null)
      setInitializationError(
        error instanceof Error ? error.message : 'No fue posible obtener la sesión institucional',
      )
    } finally {
      setIsInitializing(false)
    }
  }, [])

  useEffect(() => {
    void initializeFromGateway()
  }, [initializeFromGateway])

  const logout = useCallback(async () => {
    clearSession()
    setSessionState(null)

    try {
      await logoutFromGateway()
    } finally {
      await clearBrowserSession()
      window.location.replace('/')
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isInitializing,
      initializationError,
      retryInitialization: initializeFromGateway,
      logout,
    }),
    [session, isInitializing, initializationError, initializeFromGateway, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
