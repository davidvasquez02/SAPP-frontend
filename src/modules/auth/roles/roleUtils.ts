const LEGACY_ROLE_ALIASES: Readonly<Record<string, string>> = {
  ADMIN_SAPP: 'ADMIN_POSGRADOS',
  ADMIN: 'ADMIN_POSGRADOS',
  COORDINADOR: 'COORDINADOR_POSGRADOS',
  SECRETARIA: 'SECRETARIA_POSGRADOS',
  ESTUDIANTE: 'ESTUDIANTE_POSGRADOS',
  PROFESOR: 'DOCENTE_POSGRADOS',
  DOCENTE: 'DOCENTE_POSGRADOS',
}

export const normalizeRole = (role: string): string => {
  const normalizedRole = role.trim().toUpperCase()
  return LEGACY_ROLE_ALIASES[normalizedRole] ?? normalizedRole
}

export const normalizeRoles = (roles: readonly string[]): string[] =>
  [...new Set(roles.map(normalizeRole).filter(Boolean))]

export const formatRoleLabel = (role: string): string =>
  normalizeRole(role).replace(/_POSGRADOS$/, '').replaceAll('_', ' ')

export const hasAnyRole = (userRoles: readonly string[], requiredRoles: readonly string[]): boolean => {
  const normalizedUserRoles = new Set(normalizeRoles(userRoles))
  return normalizeRoles(requiredRoles).some((role) => normalizedUserRoles.has(role))
}

export const isProfesor = (roles: readonly string[]): boolean =>
  hasAnyRole(roles, ['DOCENTE_POSGRADOS'])
