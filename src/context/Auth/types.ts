import type { PersonaDto, RolDto } from '../../api/authTypes'

export type RoleCode =
  | 'ESTUDIANTE'
  | 'ASPIRANTE'
  | 'SECRETARIA'
  | 'COORDINACION'
  | 'COMITE'
  | 'DOCENTE'
  | 'INVITADO'

export type SessionKind = 'SAPP' | 'ASPIRANTE'

export interface AuthUser {
  id: number
  username: string
  roles: RoleCode[]
  rolesDetail?: RolDto[]
  persona: PersonaDto
  nombreCompleto?: string
  programa?: string
  email?: string
  authId: number
  activo: boolean
  lastLogin?: string
}

export interface AspiranteUser {
  id: number
  roles: RoleCode[]
  numeroInscripcionUis: string
  nombre?: string
  director?: string
  grupoInvestigacion?: string
  telefono?: string
  tipoDocumentoIdentificacion: string
  numeroDocumento: string
  emailPersonal?: string
  fechaRegistro?: string
  observaciones?: string | null
  inscripcionAdmisionId?: number | null
}

export interface AspiranteLoginParams {
  numeroInscripcion: string
  tipoDocumentoId: number
  numeroDocumento: string
}

export interface AuthSession {
  kind: SessionKind
  accessToken: string
  issuedAt?: number
  expiresAt?: number
  user: AuthUser | AspiranteUser
}

export interface AuthContextValue {
  session: AuthSession | null
  user: AuthUser | AspiranteUser | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  loginAspirante: (params: AspiranteLoginParams) => Promise<void>
  logout: () => void
}
