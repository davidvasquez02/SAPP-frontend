import { hasAnyRole } from '../modules/auth/roles/roleUtils'

export const ROLES = {
  COORDINACION: 'COORDINADOR',
  SECRETARIA: 'SECRETARIA',
  ADMIN: 'ADMIN',
} as const

export { hasAnyRole }
