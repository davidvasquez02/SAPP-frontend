import type { EstudianteDto, LoginDetalleDto, PersonaDto } from '../../api/authTypes'
import type { DirectorGradoPerfil } from '../../modules/perfil/services/directorGradoPerfilService'

export type SessionKind = 'SAPP'

export interface AuthUser {
  id: number
  username: string
  roles: string[]
  persona: PersonaDto
  estudiante?: EstudianteDto | null
  detalle: LoginDetalleDto
  nombreCompleto?: string
  programa?: string
  email?: string
  authId: number
  activo: boolean
  lastLogin?: string
  uuid?: string
  attributes?: Record<string, string[]>
  clientRoles?: string[]
}

export interface AuthSession {
  kind: SessionKind
  accessToken: string
  issuedAt?: number
  expiresAt?: number
  user: AuthUser
}

export interface AuthContextValue {
  session: AuthSession | null
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  initializationError: string | null
  retryInitialization: () => Promise<void>
  /** Roles con los que el usuario puede elegir trabajar (los asignados en el IAM, sin el rol genérico). */
  availableRoles: string[]
  /** Rol con el que está trabajando ahora: `user.roles` solo contiene este, y es lo que determina la interfaz. */
  activeRole: string | null
  changeActiveRole: (role: string) => void
  actualizarDirectorGrado: (asignacion: DirectorGradoPerfil) => void
  logout: () => Promise<void>
}
