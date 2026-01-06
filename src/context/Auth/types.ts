export type RoleCode =
  | 'ESTUDIANTE'
  | 'ASPIRANTE'
  | 'SECRETARIA'
  | 'COORDINACION'
  | 'COMITE'
  | 'DOCENTE'
  | 'INVITADO'

export interface AuthUser {
  id: number
  username: string
  roles: RoleCode[]
  nombreCompleto?: string
  programa?: string
  email?: string
}

export interface AuthSession {
  accessToken: string
  user: AuthUser
}

export interface AuthContextValue {
  session: AuthSession | null
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}
