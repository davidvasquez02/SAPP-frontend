import { canManagePosgrados, hasAnyRole, isProfesor, ROLES } from '../auth/roleGuards'

export interface PrimaryNavigationItem {
  to: string
  label: string
  icon: string
  children?: Array<{ to: string; label: string }>
}

export const getPrimaryNavigationItems = (roles: string[]): PrimaryNavigationItem[] => {
  const canSeeAdmisiones = hasAnyRole(roles, [
    ROLES.COORDINACION,
    ROLES.SECRETARIA,
    ROLES.ADMIN,
    ROLES.PROFESOR,
    ROLES.DOCENTE,
    ROLES.DIRECTOR,
  ])
  const canSeeGestionEstudiantes = canManagePosgrados(roles)
  const canSeeGestionCoordinacion = canManagePosgrados(roles)
  const isProfesorOnly =
    isProfesor(roles) &&
    !canManagePosgrados(roles)

  return [
    { to: '/admisiones', label: 'Admisiones', icon: '🧑‍🎓', visible: canSeeAdmisiones },
    {
      to: '/matricula',
      label: 'Matrícula',
      icon: '🎓',
      visible: !isProfesorOnly,
      children: [
        { to: '/matricula/academica', label: 'Matrícula académica' },
        { to: '/matricula/financiera', label: 'Matrícula financiera' },
      ],
    },
    { to: '/solicitudes', label: 'Solicitudes', icon: '📨', visible: true },
    { to: '/trabajos-grado', label: 'Proyectos de grado', icon: '📘', visible: !isProfesorOnly },
    {
      to: '/creditos-condonables',
      label: 'Créditos condonables',
      icon: '💳',
      visible: canManagePosgrados(roles),
    },
    {
      to: '/coordinacion/estudiantes',
      label: 'Estudiantes',
      icon: '👥',
      visible: canSeeGestionEstudiantes,
    },
    {
      to: '/coordinacion/reportes',
      label: 'Informes a dependencias',
      icon: '🏛️',
      visible: canSeeGestionCoordinacion,
    },
    { to: '/actas', label: 'Actas', icon: '📜', visible: canSeeGestionCoordinacion },
    { to: '/fechas', label: 'Fechas', icon: '🗓️', visible: canSeeGestionCoordinacion },
    {
      to: '/coordinacion/profesores',
      label: 'Gestión profesores',
      icon: '🧑‍🏫',
      visible: canSeeGestionCoordinacion,
    },
  ]
    .filter(({ visible }) => visible)
    .map(({ to, label, icon, children }) => ({ to, label, icon, children }))
}
