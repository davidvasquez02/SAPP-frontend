import type { JuradoEvaluador } from './types'

const ESTADOS_AGENDABLES = new Set([
  'CONCEPTOS_REC',
  'CONCEPTOS_RECIBIDOS',
  'EN_AJUSTES',
  'AJUSTES_RECIB',
  'AJUSTES_RECIBIDOS',
])

const normalizarEstadoProceso = (estado: string): string =>
  estado.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleUpperCase('es-CO').replace(/[\s-]+/g, '_')

export const puedeAgendarSustentacion = (estado: string): boolean =>
  ESTADOS_AGENDABLES.has(normalizarEstadoProceso(estado))

const esEvaluacionDeSustentacion = (momento: string | null | undefined): boolean =>
  momento != null && normalizarEstadoProceso(momento) === 'SUSTENTACION'

export const todosLosJuradosActivosEvaluaronSustentacion = (
  jurados: JuradoEvaluador[],
): boolean => {
  const juradosActivos = jurados.filter((jurado) => jurado.activo)

  return juradosActivos.length > 0 && juradosActivos.every((jurado) =>
    (jurado.evaluaciones ?? []).some((evaluacion) =>
      [evaluacion.momentoCodigo, evaluacion.momento, evaluacion.momentoNombre]
        .some(esEvaluacionDeSustentacion),
    ),
  )
}
