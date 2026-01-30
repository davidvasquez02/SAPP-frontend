import type { PersonaDto } from '../../api/authTypes'

export type SessionKind = 'SAPP' | 'ASPIRANTE'

export interface AuthUser {
  id: number
  username: string
  roles: string[]
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
  roles: string[]
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
