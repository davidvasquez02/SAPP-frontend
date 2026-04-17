import { hasAnyRole, isProfesor } from '../modules/auth/roles/roleUtils'

export const ROLES = {
  COORDINACION: 'COORDINADOR',
  SECRETARIA: 'SECRETARIA',
  ADMIN: 'ADMIN',
  PROFESOR: 'PROFESOR',
  DOCENTE: 'DOCENTE',
} as const

export { hasAnyRole, isProfesor }
