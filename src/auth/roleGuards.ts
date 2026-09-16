import { hasAnyRole, isProfesor } from '../modules/auth/roles/roleUtils'

export const ROLES = {
  COORDINACION: 'COORDINADOR',
  SECRETARIA: 'SECRETARIA',
  ADMIN: 'ADMIN',
  PROFESOR: 'PROFESOR',
  DOCENTE: 'DOCENTE',
  DIRECTOR: 'DIRECTOR',
  ESTUDIANTE: 'ESTUDIANTE',
} as const

export const isEvaluadorAdmision = (roles: string[]): boolean =>
  hasAnyRole(roles, [ROLES.PROFESOR, ROLES.DOCENTE, ROLES.DIRECTOR])

export { hasAnyRole, isProfesor }
