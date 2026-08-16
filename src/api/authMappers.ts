import type { GatewayLoginResponseDto } from './authTypes'
import type { AuthSession } from '../context/Auth'

const normalizeRoles = (roles: string[]) => roles.map((role) => role.toUpperCase())

export const mapGatewayLoginToUserSession = (dto: GatewayLoginResponseDto): AuthSession => ({
  kind: 'SAPP',
  // Authentication is handled upstream by the gateway; this marker is never sent as a Bearer token.
  accessToken: 'NO_TOKEN',
  issuedAt: Math.floor(Date.now() / 1000),
  user: {
    id: dto.id,
    uuid: dto.uuid,
    username: dto.username,
    roles: [...new Set(normalizeRoles([...(dto.roles ?? []), ...(dto.clientRoles ?? [])]))],
    clientRoles: normalizeRoles(dto.clientRoles ?? []),
    attributes: dto.attributes ?? {},
    persona: {
      id: dto.id,
      tipoDocumento: '',
      numeroDocumento: '',
      nombre1: dto.firstName,
      nombre2: '',
      apellido1: dto.lastName,
      apellido2: '',
      emailPersonal: null,
      emailInstitucional: dto.email,
      telefono: null,
    },
    estudiante: null,
    nombreCompleto: dto.fullName,
    programa: dto.attributes?.academicProgram?.[0],
    email: dto.email,
    authId: dto.id,
    activo: true,
  },
})
