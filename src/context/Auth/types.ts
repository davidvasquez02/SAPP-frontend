export type UserRole =
  | 'ESTUDIANTE'
  | 'ASPIRANTE'
  | 'SECRETARIA'
  | 'COORDINACION'
  | 'COMITE'
  | 'DOCENTE'
  | 'INVITADO'

export interface AuthUser {
  id: string
  name: string
  role: UserRole
}

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}
