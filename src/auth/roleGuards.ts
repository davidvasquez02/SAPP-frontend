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

/**
 * Perfiles administrativos que actualmente comparten toda la capacidad
 * operativa de coordinación. Se mantiene cada rol explícito para poder
 * separarlos cuando cambien las reglas de negocio.
 */
export const ROLES_GESTION_POSGRADOS = [
  ROLES.COORDINACION,
  ROLES.ADMIN,
  ROLES.SECRETARIA,
] as const

export const canManagePosgrados = (roles: readonly string[]): boolean =>
  hasAnyRole(roles, ROLES_GESTION_POSGRADOS)

export const isEvaluadorAdmision = (roles: readonly string[]): boolean =>
  hasAnyRole(roles, [ROLES.PROFESOR, ROLES.DOCENTE, ROLES.DIRECTOR])

export { hasAnyRole, isProfesor }
