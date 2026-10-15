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
  actualizarDirectorGrado: (asignacion: DirectorGradoPerfil) => void
  logout: () => Promise<void>
}
