import { hasAnyRole, isProfesor } from '../modules/auth/roles/roleUtils'

export const ROLES = {
  COORDINACION: 'COORDINADOR_POSGRADOS',
  SECRETARIA: 'SECRETARIA_POSGRADOS',
  ADMIN: 'ADMIN_POSGRADOS',
  PROFESOR: 'DOCENTE_POSGRADOS',
  DOCENTE: 'DOCENTE_POSGRADOS',
  DIRECTOR: 'DIRECTOR',
  ESTUDIANTE: 'ESTUDIANTE_POSGRADOS',
} as const

export const isEvaluadorAdmision = (roles: string[]): boolean =>
  hasAnyRole(roles, [ROLES.PROFESOR, ROLES.DOCENTE, ROLES.DIRECTOR])

export { hasAnyRole, isProfesor }
