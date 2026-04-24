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
  kind: 'ASPIRANTE'
  accessToken: string
  user: AspiranteUser
}

export interface AuthContextValue {
  session: AuthSession | null
  user: AspiranteUser | null
  token: string | null
  isAuthenticated: boolean
  loginAspirante: (params: AspiranteLoginParams) => Promise<void>
  logout: () => void
}
