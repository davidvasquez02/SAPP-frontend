import type { EvaluacionAdmisionItem } from '../types/evaluacionAdmisionTypes'

export const ESTADO_ENTREVISTA_NO_INICIADA = 'Evaluación no iniciada'

export const getOrdenEstadoEntrevista = (label: string | undefined): number => {
  if (label === 'Pendiente de calificación') return 0
  if (label === 'Calificado') return 1
  if (label === ESTADO_ENTREVISTA_NO_INICIADA) return 2
  return 3
}

export const getEstadoEntrevista = (items: EvaluacionAdmisionItem[], usuarioId: number) => {
  const propios = items.filter((item) => item.etapaEvaluacion === 'ENTREVISTA' &&
    item.codigo !== 'ENTREV' && item.evaluadorId === usuarioId)
  const completos = propios.filter((item) => typeof item.puntajeAspirante === 'number' &&
    Number.isFinite(item.puntajeAspirante) && Boolean(item.fechaRegistro?.trim())).length
  return {
    total: propios.length,
    completos,
    label: propios.length === 0 ? ESTADO_ENTREVISTA_NO_INICIADA :
      completos === propios.length ? 'Calificado' : 'Pendiente de calificación',
  }
}
