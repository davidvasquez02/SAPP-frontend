import { normalizeRole, normalizeRoles } from './roleUtils'

/** Rol genérico que el IAM asigna a todos: no es un rol con el que se trabaje. */
export const GENERIC_SYSTEM_ROLE = 'DEFAULT-ROLES-EISI'

const STORAGE_KEY = 'SAPP_ACTIVE_ROLE'
const COORDINADOR = 'COORDINADOR_POSGRADOS'
const PROFESOR = 'DOCENTE_POSGRADOS'

const ETIQUETAS: Readonly<Record<string, string>> = {
  ADMIN_POSGRADOS: 'Administrador',
  COORDINADOR_POSGRADOS: 'Coordinador',
  SECRETARIA_POSGRADOS: 'Secretaría',
  DOCENTE_POSGRADOS: 'Profesor',
  ESTUDIANTE_POSGRADOS: 'Estudiante',
  DIRECTOR: 'Director',
}

/** Roles con los que el usuario puede elegir trabajar: los asignados, sin el rol genérico del sistema. */
export const getSelectableRoles = (roles: readonly string[] | null | undefined): string[] => {
  const elegibles = normalizeRoles(roles ?? []).filter((role) => role !== GENERIC_SYSTEM_ROLE)
  const profesor = elegibles.indexOf(PROFESOR)
  const coordinador = elegibles.indexOf(COORDINADOR)
  if (profesor >= 0 && coordinador > profesor) {
    elegibles.splice(coordinador, 1)
    elegibles.splice(profesor, 0, COORDINADOR)
  }
  return elegibles
}

/**
 * Rol con el que se trabaja: el último que el usuario eligió, si todavía lo tiene asignado; si no, el primero de su
 * lista. Sin roles utilizables devuelve null.
 */
export const resolveActiveRole = (selectable: readonly string[], preferred: string | null | undefined): string | null => {
  if (selectable.length === 0) return null
  const elegido = preferred ? normalizeRole(preferred) : null
  return elegido && selectable.includes(elegido) ? elegido : selectable[0]
}

/** Al cargar, Coordinador tiene prioridad sobre una elección anterior de Profesor. */
export const resolveInitialActiveRole = (selectable: readonly string[], preferred: string | null): string | null =>
  preferred && normalizeRole(preferred) === PROFESOR && selectable.includes(PROFESOR) && selectable.includes(COORDINADOR)
    ? COORDINADOR
    : resolveActiveRole(selectable, preferred)

/** Copia de la sesión que solo expone el rol activo: así cada pantalla y cada guarda de rutas muestra lo de ese rol. */
export const applyActiveRole = <T extends { user: { roles: string[] } }>(session: T | null, activeRole: string | null): T | null => {
  if (!session || !activeRole) return session
  return { ...session, user: { ...session.user, roles: [activeRole] } }
}

/** "Profesor", "Coordinador"…: el nombre con el que se presenta un rol en el selector. */
export const formatRoleDisplay = (role: string): string => {
  const normalizado = normalizeRole(role)
  const conocido = ETIQUETAS[normalizado]
  if (conocido) return conocido
  const texto = normalizado.replace(/_POSGRADOS$/, '').replaceAll('_', ' ').toLowerCase()
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

interface PreferenciaGuardada {
  usuario: string
  rol: string
}

/** Rol elegido la última vez por este usuario en este navegador (cada usuario conserva el suyo). */
export const readStoredActiveRole = (usuario: string): string | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const guardada = JSON.parse(raw) as PreferenciaGuardada
    return guardada.usuario === usuario ? guardada.rol : null
  } catch {
    return null
  }
}

export const storeActiveRole = (usuario: string, rol: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ usuario, rol } satisfies PreferenciaGuardada))
  } catch {
    // sin almacenamiento disponible: el rol elegido solo vale mientras la pestaña siga abierta
  }
}

export const clearStoredActiveRole = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // nada que limpiar
  }
}
