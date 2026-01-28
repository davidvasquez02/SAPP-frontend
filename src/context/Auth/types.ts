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
  numeroAspirante: string
  roles: RoleCode[]
  programa?: string
  nombres?: string
  apellidos?: string
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
  loginAspirante: (numeroAspirante: string) => Promise<void>
  logout: () => void
}
