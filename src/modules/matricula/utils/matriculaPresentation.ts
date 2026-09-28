type MatriculaSeleccionable = {
  id: number
  periodoId: number
  fechaSolicitud: string
}

const MATRICULA_ESTADO_LABELS: Record<string, string> = {
  PENDIENTE_DOCUMENTOS: 'Pendiente de documentos',
  RADICADA: 'Radicada',
  FINALIZADA: 'Finalizada',
}

const ASIGNATURA_ESTADO_LABELS: Record<string, string> = {
  APROBADA: 'Aprobada',
  MATRICULADA: 'Matriculada',
  NO_MATRICULADA: 'No matriculada',
  PENDIENTE: 'Pendiente',
  RECHAZADA: 'Rechazada',
}

const humanizeUnknownEstado = (estado: string): string => {
  const normalized = estado.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
  if (!normalized) return 'Sin información'

  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1).toLowerCase()}`
}

export const getMatriculaEstadoLabel = (estado: string): string =>
  MATRICULA_ESTADO_LABELS[estado.trim().toUpperCase()] ?? humanizeUnknownEstado(estado)

export const getAsignaturaEstadoLabel = (estado: string): string =>
  ASIGNATURA_ESTADO_LABELS[estado.trim().toUpperCase()] ?? humanizeUnknownEstado(estado)

export const getMatriculaEstadoModifier = (estado: string): string => {
  const normalized = estado.trim().toUpperCase()
  if (normalized === 'PENDIENTE_DOCUMENTOS') return 'pendiente-documentos'
  if (normalized === 'RADICADA') return 'radicada'
  if (normalized === 'FINALIZADA') return 'finalizada'
  return 'default'
}

export const getMatriculaAcademicaDetallePath = (matriculaId: number | string): string =>
  `/matricula/academica/${encodeURIComponent(matriculaId)}`

/**
 * The student endpoint is scoped to the authenticated student but returns an array.
 * Prefer the requested period when one is known; otherwise choose deterministically by
 * the contract's request timestamp and id instead of depending on array order.
 */
export const selectStudentMatricula = <T extends MatriculaSeleccionable>(
  matriculas: T[],
  periodoId?: number,
): T | null => {
  const candidates = periodoId == null
    ? matriculas
    : matriculas.filter((matricula) => matricula.periodoId === periodoId)

  return [...candidates].sort((a, b) => {
    const byDate = b.fechaSolicitud.localeCompare(a.fechaSolicitud)
    return byDate !== 0 ? byDate : b.id - a.id
  })[0] ?? null
}

export const formatBackendDateTime = (value: string | null): string => {
  if (!value) return '—'

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?/)
  if (!match) return value

  const [, year, month, day, hour, minute] = match
  return hour && minute ? `${day}/${month}/${year}, ${hour}:${minute}` : `${day}/${month}/${year}`
}
