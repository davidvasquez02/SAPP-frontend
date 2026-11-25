import { useCallback, useEffect, useMemo, useState } from 'react'
import { getLogoutRedirectUrl, loginFromGateway } from '../../api/authService'
import { mapGatewayLoginToUserSession } from '../../api/authMappers'
import { canManagePosgrados } from '../../auth/roleGuards'
import {
  applyActiveRole,
  clearStoredActiveRole,
  getSelectableRoles,
  readStoredActiveRole,
  resolveActiveRole,
  storeActiveRole,
} from '../../modules/auth/roles/activeRole'
import { clearSession, getSession, saveSession } from '../../modules/auth/session/sessionStore'
import { clearBrowserSession } from '../../modules/auth/session/clearBrowserSession'
import { prefetchFotosEstudiantesActivos } from '../../modules/estudiantes/services/estudianteFotoPrefetch'
import { AuthContext } from './context'
import type { AuthContextValue, AuthSession } from './types'
import { actualizarDirectorEnSession } from '../../modules/perfil/utils/directorGradoSession'
import type { DirectorGradoPerfil } from '../../modules/perfil/services/directorGradoPerfilService'

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

/** Clave con la que se recuerda el rol elegido de cada usuario. */
const claveDeUsuario = (session: AuthSession | null): string | null =>
  session ? String(session.user.uuid ?? session.user.id) : null

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Sesión tal como la entrega el IAM, con todos los roles del usuario. Es la que se guarda; la que ven las pantallas
  // (`session`) solo trae el rol con el que se está trabajando.
  const [baseSession, setSessionState] = useState<AuthSession | null>(() => getInitialSession())
  const [preferredRole, setPreferredRole] = useState<string | null>(() => {
    const clave = claveDeUsuario(getInitialSession())
    return clave ? readStoredActiveRole(clave) : null
  })
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
      const clave = claveDeUsuario(authenticatedSession)
      setPreferredRole(clave ? readStoredActiveRole(clave) : null)

      // Adelanta la carga de fotos del modulo de Estudiantes para que, cuando el coordinador
      // entre, ya esten en cache y no haya que esperar el lote (~10s). Fire-and-forget: no
      // bloquea el login ni afecta nada si falla.
      const rolInicial = resolveActiveRole(
        getSelectableRoles(authenticatedSession.user.roles),
        clave ? readStoredActiveRole(clave) : null,
      )
      if (rolInicial && canManagePosgrados([rolInicial])) {
        void prefetchFotosEstudiantesActivos()
      }
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
    clearStoredActiveRole()
    setSessionState(null)
    setPreferredRole(null)

    try {
      await clearBrowserSession()
    } finally {
      window.location.replace(getLogoutRedirectUrl())
    }
  }, [])

  const actualizarDirectorGrado = useCallback((asignacion: DirectorGradoPerfil) => {
    setSessionState((current) => actualizarDirectorEnSession(current, asignacion))
  }, [])

  useEffect(() => {
    if (baseSession) saveSession(baseSession)
  }, [baseSession])

  const availableRoles = useMemo(() => getSelectableRoles(baseSession?.user.roles), [baseSession])
  const activeRole = useMemo(() => resolveActiveRole(availableRoles, preferredRole), [availableRoles, preferredRole])
  const session = useMemo(() => applyActiveRole(baseSession, activeRole), [baseSession, activeRole])

  const changeActiveRole = useCallback(
    (role: string) => {
      const clave = claveDeUsuario(baseSession)
      // solo se puede elegir uno de los roles asignados; cualquier otro valor se ignora
      if (!clave || !availableRoles.includes(role)) return
      storeActiveRole(clave, role)
      setPreferredRole(role)
    },
    [availableRoles, baseSession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isInitializing,
      initializationError,
      retryInitialization: initializeFromGateway,
      availableRoles,
      activeRole,
      changeActiveRole,
      actualizarDirectorGrado,
      logout,
    }),
    [
      session,
      isInitializing,
      initializationError,
      initializeFromGateway,
      availableRoles,
      activeRole,
      changeActiveRole,
      actualizarDirectorGrado,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
