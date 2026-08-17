import { useCallback, useEffect, useMemo, useState } from 'react'
import { loginFromGateway } from '../../api/authService'
import { mapGatewayLoginToUserSession } from '../../api/authMappers'
import { clearSession, getSession, saveSession } from '../../modules/auth/session/sessionStore'
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

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isInitializing,
      initializationError,
      retryInitialization: initializeFromGateway,
    }),
    [session, isInitializing, initializationError, initializeFromGateway],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
