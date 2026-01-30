export interface JwtPayload {
  sub?: string
  iat?: number
  exp?: number
  rolesUsuario?: string[]
  roles?: string[]
  idUsuario?: number
  nombreUsuario?: string
}
