import type { LoginResponseDataDto } from './authTypes'
import type { AuthSession } from '../context/Auth'

const buildNombreCompleto = (dto: LoginResponseDataDto) => {
  const parts = [
    dto.persona.nombre1,
    dto.persona.nombre2,
    dto.persona.apellido1,
    dto.persona.apellido2,
  ]

  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

export const mapLoginDataToAuthSession = (dto: LoginResponseDataDto): AuthSession => {
  return {
    kind: 'SAPP',
    accessToken: 'NO_TOKEN',
    user: {
      id: dto.id,
      username: dto.username,
      roles: ['ESTUDIANTE'],
      nombreCompleto: buildNombreCompleto(dto),
      email: dto.persona.emailInstitucional ?? dto.persona.emailPersonal ?? undefined,
      authId: dto.authId,
      activo: dto.activo,
      personaId: dto.persona.id,
    },
  }
}
