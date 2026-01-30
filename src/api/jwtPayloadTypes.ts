import type { RolDto } from './authTypes'

export interface JwtPayload {
  sub?: string
  iat?: number
  exp?: number
  rolesUsuario?: RolDto[]
  idUsuario?: number
  nombreUsuario?: string
}
