import type { LoginResponseDto, RolDto } from './authTypes'
import type { JwtPayload } from './jwtPayloadTypes'
import type { AuthSession, RoleCode } from '../context/Auth'
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

const buildRoleCodes = (roles: RolDto[]): RoleCode[] =>
  roles.map((role) => role.codigo as RoleCode)

export const mapLoginToUserSession = (dto: LoginResponseDto): AuthSession => {
  const payload = decodeJwtPayload<JwtPayload>(dto.token)
  const username = payload.nombreUsuario ?? payload.sub ?? dto.username
  const userId = payload.idUsuario ?? dto.id
  const roles = payload.rolesUsuario ?? dto.roles
  const rolesCodes = buildRoleCodes(roles)

  return {
    kind: 'SAPP',
    accessToken: dto.token,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
    user: {
      id: userId,
      username,
      roles: rolesCodes,
      rolesDetail: roles,
      persona: dto.persona,
      nombreCompleto: buildNombreCompleto(dto),
      email: dto.persona.emailInstitucional ?? dto.persona.emailPersonal ?? undefined,
      authId: dto.authId,
      activo: dto.activo,
      lastLogin: dto.lastLogin,
    },
  }
}
