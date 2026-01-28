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
  nombreCompleto?: string
  programa?: string
  email?: string
  personaId?: number
  authId?: number
  activo?: boolean
}

export interface AspiranteUser {
  id: number
  roles: RoleCode[]
  numeroInscripcionUis: string
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
