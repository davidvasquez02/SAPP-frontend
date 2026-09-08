import { hasAnyRole, isProfesor, ROLES } from '../auth/roleGuards'

export interface PrimaryNavigationItem {
  to: string
  label: string
  icon: string
}

export const getPrimaryNavigationItems = (roles: string[]): PrimaryNavigationItem[] => {
  const canSeeAdmisiones = hasAnyRole(roles, [
    ROLES.COORDINACION,
    ROLES.SECRETARIA,
    ROLES.ADMIN,
    ROLES.PROFESOR,
    ROLES.DOCENTE,
  ])
  const canSeeGestionEstudiantes = hasAnyRole(roles, [
    ROLES.COORDINACION,
    ROLES.SECRETARIA,
    ROLES.ADMIN,
  ])
  const canSeeGestionCoordinacion = hasAnyRole(roles, [ROLES.COORDINACION, ROLES.ADMIN])
  const isProfesorOnly =
    isProfesor(roles) &&
    !hasAnyRole(roles, [ROLES.COORDINACION, ROLES.SECRETARIA, ROLES.ADMIN])

  return [
    { to: '/solicitudes', label: 'Solicitudes', icon: '📨', visible: true },
    { to: '/matricula', label: 'Matrícula', icon: '🎓', visible: !isProfesorOnly },
    {
      to: '/coordinacion/estudiantes',
      label: 'Estudiantes',
      icon: '👥',
      visible: canSeeGestionEstudiantes,
    },
    { to: '/admisiones', label: 'Admisiones', icon: '🧑‍🎓', visible: canSeeAdmisiones },
    {
      to: '/coordinacion/reportes',
      label: 'Informes a dependencias',
      icon: '🏛️',
      visible: canSeeGestionCoordinacion,
    },
    { to: '/actas', label: 'Actas', icon: '📜', visible: canSeeGestionCoordinacion },
    { to: '/fechas', label: 'Fechas', icon: '🗓️', visible: canSeeGestionCoordinacion },
  ]
    .filter(({ visible }) => visible)
    .map(({ to, label, icon }) => ({ to, label, icon }))
}
