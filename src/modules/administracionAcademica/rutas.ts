export const RUTA_ADMINISTRACION = '/administracion-academica'
export const RUTA_CALENDARIO = `${RUTA_ADMINISTRACION}/calendario`
export const RUTA_PROFESORES = `${RUTA_ADMINISTRACION}/profesores`
export const RUTA_GRUPOS = `${RUTA_ADMINISTRACION}/grupos-investigacion`
export const RUTA_PLANTILLAS = `${RUTA_ADMINISTRACION}/plantillas-correo`
export const RUTA_RUBRICA = `${RUTA_ADMINISTRACION}/rubrica-evaluacion`
export const RUTA_BANCO_EVALUADORES = `${RUTA_ADMINISTRACION}/banco-evaluadores`
export const RUTA_ROLES = `${RUTA_ADMINISTRACION}/roles`

export const SECCIONES_ADMINISTRACION = [
  { to: RUTA_CALENDARIO, label: 'Calendario académico', icon: '/fechas' },
  { to: RUTA_PROFESORES, label: 'Profesores', icon: '/coordinacion/profesores' },
  { to: RUTA_GRUPOS, label: 'Grupos de investigación', icon: '/coordinacion/grupos-investigacion' },
  { to: RUTA_PLANTILLAS, label: 'Plantillas de correo', icon: '/coordinacion/plantillas-correo' },
  { to: RUTA_RUBRICA, label: 'Rúbrica de evaluación', icon: '/coordinacion/rubrica-evaluacion' },
  { to: RUTA_BANCO_EVALUADORES, label: 'Banco de evaluadores', icon: '/coordinacion/banco-evaluadores' },
  { to: RUTA_ROLES, label: 'Gestión de roles', icon: '/coordinacion/roles' },
] as const

export const RUTAS_ANTERIORES_ADMINISTRACION = [
  { anterior: '/fechas', actual: RUTA_CALENDARIO },
  { anterior: '/coordinacion/profesores', actual: RUTA_PROFESORES },
  { anterior: '/coordinacion/grupos-investigacion', actual: RUTA_GRUPOS },
  { anterior: '/coordinacion/plantillas-correo', actual: RUTA_PLANTILLAS },
] as const

/** Conserva los identificadores y subrutas, sin capturar prefijos de otros módulos. */
export const migrarRutaAdministracion = (pathname: string): string | null => {
  const ruta = RUTAS_ANTERIORES_ADMINISTRACION.find(
    ({ anterior }) => pathname === anterior || pathname.startsWith(`${anterior}/`),
  )
  return ruta ? `${ruta.actual}${pathname.slice(ruta.anterior.length)}` : null
}

interface UbicacionAnterior {
  pathname: string
  search: string
  hash: string
}

export const destinoAdministracion = ({ pathname, search, hash }: UbicacionAnterior) => ({
  pathname: migrarRutaAdministracion(pathname) ?? RUTA_CALENDARIO,
  search,
  hash,
})
