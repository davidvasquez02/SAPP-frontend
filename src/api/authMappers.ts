import type { GatewayLoginResponseDto } from './authTypes'
import type { AuthSession } from '../context/Auth'
import { normalizeRoles } from '../modules/auth/roles/roleUtils'

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

export const mapGatewayLoginToUserSession = (dto: GatewayLoginResponseDto): AuthSession => {
  const clientRoles = normalizeRoles(dto.clientRoles ?? [])
  const effectiveRoles = clientRoles.length > 0 ? clientRoles : normalizeRoles(dto.roles ?? [])

  return {
    kind: 'SAPP',
    // Authentication is handled upstream by the gateway; this marker is never sent as a Bearer token.
    accessToken: 'NO_TOKEN',
    issuedAt: Math.floor(Date.now() / 1000),
    user: {
      id: dto.id,
      uuid: dto.uuid,
      username: dto.username,
      // clientRoles is authoritative. roles is only a fallback for old gateway responses
      // that do not include any client-specific role yet.
      roles: effectiveRoles,
      clientRoles,
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
  }
}
