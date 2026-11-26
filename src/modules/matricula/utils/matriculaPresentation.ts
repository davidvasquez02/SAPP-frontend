import type { HistorialAsignaturaDto } from '../types'

type MatriculaSeleccionable = {
  id: number
  periodoId: number
  fechaSolicitud: string
}

const MATRICULA_ESTADO_LABELS: Record<string, string> = {
  PENDIENTE_DOCUMENTOS: 'Pendiente de documentos',
  RADICADA: 'Radicada',
  FINALIZADA: 'Finalizada',
  INCLUSION_POR_VALIDAR: 'Inclusión por validar',
}

export const esMatriculaConSeleccionCerrada = (estado: string): boolean =>
  ['FINALIZADA', 'INCLUSION_POR_VALIDAR'].includes(estado.trim().toUpperCase())

const ASIGNATURA_ESTADO_LABELS: Record<string, string> = {
  APROBADA: 'Aprobada',
  CANCELACION_RECHAZADA: 'Cancelación rechazada',
  CANCELACION_SOLICITADA: 'Cancelación solicitada',
  INCLUSION_RECHAZADA: 'Inclusión rechazada',
  INCLUSION_SOLICITADA: 'Inclusión solicitada',
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

/**
 * Ajuste 40: PENDIENTE_DOCUMENTOS cubre dos situaciones distintas -- al estudiante le faltan
 * documentos por cargar (documentosCompletos === false), o ya cargó todo y espera a que
 * coordinación apruebe/rechace cada uno (documentosCompletos === true). documentosCompletos es
 * null fuera de ese estado, donde no aplica la distinción.
 */
export const getMatriculaEstadoLabel = (estado: string, documentosCompletos?: boolean | null): string => {
  const normalized = estado.trim().toUpperCase()
  if (normalized === 'PENDIENTE_DOCUMENTOS' && documentosCompletos != null) {
    return documentosCompletos ? 'Pendiente de validación' : 'Pendiente de documentos'
  }
  return MATRICULA_ESTADO_LABELS[normalized] ?? humanizeUnknownEstado(estado)
}

export const getAsignaturaEstadoLabel = (estado: string): string =>
  ASIGNATURA_ESTADO_LABELS[estado.trim().toUpperCase()] ?? humanizeUnknownEstado(estado)

export const getAsignaturaBadgeModifier = (estado: string) => {
  switch (estado.trim().toUpperCase()) {
    case 'APROBADA':
    case 'MATRICULADA':
    case 'CANCELACION_RECHAZADA':
      return 'approved'
    case 'NO_MATRICULADA':
    case 'RECHAZADA':
    case 'INCLUSION_RECHAZADA':
    case 'CANCELADA':
      return 'rejected'
    case 'INCLUSION_SOLICITADA':
    case 'CANCELACION_SOLICITADA':
      return 'review'
    default:
      return 'pending'
  }
}

export const resumirHistorialAsignaturasPorPeriodo = (historial: HistorialAsignaturaDto[]) => {
  const periodos = new Map<string, Map<number, HistorialAsignaturaDto>>()

  for (const fila of historial) {
    const periodo = fila.periodoAcademico.trim().replace(/\s*-\s*/g, '-')
    const asignaturas = periodos.get(periodo) ?? new Map<number, HistorialAsignaturaDto>()
    const cambioAnterior = asignaturas.get(fila.asignaturaId)
    // La API ordena por fecha e ID ascendentes, así que en un empate prevalece la última fila.
    if (!cambioAnterior || fila.fecha.replace(' ', 'T') >= cambioAnterior.fecha.replace(' ', 'T')) {
      asignaturas.set(fila.asignaturaId, fila)
    }
    periodos.set(periodo, asignaturas)
  }

  return Array.from(periodos)
    .sort(([periodoA], [periodoB]) => periodoB.localeCompare(periodoA, 'es-CO', { numeric: true }))
    .map(([periodo, asignaturas]) => ({
      periodo,
      asignaturas: Array.from(asignaturas.values()).sort((a, b) =>
        a.asignaturaNombre.localeCompare(b.asignaturaNombre, 'es-CO')),
    }))
}

export const getMatriculaEstadoModifier = (estado: string, documentosCompletos?: boolean | null): string => {
  const normalized = estado.trim().toUpperCase()
  if (normalized === 'PENDIENTE_DOCUMENTOS') return documentosCompletos ? 'pendiente-validacion' : 'pendiente-documentos'
  if (normalized === 'RADICADA') return 'radicada'
  if (normalized === 'INCLUSION_POR_VALIDAR') return 'pendiente-validacion'
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
