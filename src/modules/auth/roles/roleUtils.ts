const normalizeRoles = (roles: string[]) => roles.map((role) => role.toUpperCase())

export const hasAnyRole = (userRoles: string[], requiredRoles: string[]): boolean => {
  const normalizedUserRoles = new Set(normalizeRoles(userRoles))
  return normalizeRoles(requiredRoles).some((role) => normalizedUserRoles.has(role))
}
