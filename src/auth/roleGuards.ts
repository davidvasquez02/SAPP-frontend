export const ROLES = {
  COORDINACION: 'COORDINADOR',
  SECRETARIA: 'SECRETARIA',
} as const

export function hasAnyRole(userRoles: string[], allowed: string[]): boolean {
  return allowed.some((role) => userRoles.includes(role))
}
