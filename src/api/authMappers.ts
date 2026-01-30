import type { LoginResponseDto } from './authTypes'
import type { JwtPayload } from './jwtPayloadTypes'
import type { AuthSession } from '../context/Auth'
import { decodeJwtPayload } from '../utils/jwt'

const buildNombreCompleto = (dto: LoginResponseDto) => {
  const parts = [
    dto.persona.nombre1,
    dto.persona.nombre2,
    dto.persona.apellido1,
    dto.persona.apellido2,
  ]

  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

const normalizeRoles = (roles: string[]) => roles.map((role) => role.toUpperCase())

export const mapLoginToUserSession = (dto: LoginResponseDto): AuthSession => {
  const payload = decodeJwtPayload<JwtPayload>(dto.token)
  const username = payload.nombreUsuario ?? payload.sub ?? dto.username
  const userId = payload.idUsuario ?? dto.id
  const responseRoles = Array.isArray(dto.roles) ? dto.roles : []
  const tokenRoles = Array.isArray(payload.roles)
    ? payload.roles
    : Array.isArray(payload.rolesUsuario)
      ? payload.rolesUsuario
      : []
  const roles = responseRoles.length > 0 ? responseRoles : tokenRoles
  const normalizedRoles = normalizeRoles(roles)

  return {
    kind: 'SAPP',
    accessToken: dto.token,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
    user: {
      id: userId,
      username,
      roles: normalizedRoles,
      persona: dto.persona,
      nombreCompleto: buildNombreCompleto(dto),
      email: dto.persona.emailInstitucional ?? dto.persona.emailPersonal ?? undefined,
      authId: dto.authId,
      activo: dto.activo,
      lastLogin: dto.lastLogin,
    },
  }
}
