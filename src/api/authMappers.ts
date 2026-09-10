import type { GatewayLoginResponseDto } from './authTypes'
import type { AuthSession } from '../context/Auth'

const normalizeRoles = (roles: string[]) => roles.map((role) => role.toUpperCase())

const mapPersona = (dto: GatewayLoginResponseDto) => {
  const aspirante = dto.detalle.aspirante
  const persona = dto.detalle.persona

  return {
    // The local persona id must come from detalle, not from the gateway's top-level projection.
    id: persona.id,
    tipoDocumento: aspirante?.tipoDocumentoIdentificacion ?? '',
    numeroDocumento: aspirante?.numeroDocumento ?? dto.attributes?.documentNumber?.[0] ?? '',
    nombre1: aspirante?.nombre1 ?? persona.firstName,
    nombre2: aspirante?.nombre2 ?? '',
    apellido1: aspirante?.apellido1 ?? persona.lastName,
    apellido2: aspirante?.apellido2 ?? '',
    emailPersonal: aspirante?.emailPersonal ?? dto.attributes?.personalEmail?.[0] ?? null,
    emailInstitucional: persona.email || dto.email,
    telefono: aspirante?.telefono ?? dto.attributes?.phone?.[0] ?? null,
  }
}

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
    persona: mapPersona(dto),
    estudiante: dto.detalle.estudiante,
    // Preserve the complete new /inicio projection, including every domain-specific id.
    detalle: dto.detalle,
    nombreCompleto: dto.fullName,
    programa: dto.attributes?.academicProgram?.[0],
    email: dto.email,
    authId: dto.id,
    activo: true,
  },
})
