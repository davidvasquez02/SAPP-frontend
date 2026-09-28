import type { EvaluacionAdmisionItem } from '../types/evaluacionAdmisionTypes'

export const getEstadoEntrevista = (items: EvaluacionAdmisionItem[], usuarioId: number) => {
  const propios = items.filter((item) => item.etapaEvaluacion === 'ENTREVISTA' &&
    item.codigo !== 'ENTREV' && item.evaluadorId === usuarioId)
  const completos = propios.filter((item) => typeof item.puntajeAspirante === 'number' &&
    Number.isFinite(item.puntajeAspirante) && Boolean(item.fechaRegistro?.trim())).length
  return {
    total: propios.length,
    completos,
    label: propios.length === 0 ? 'Sin aspectos asignados' :
      completos === propios.length ? 'Calificado' : 'Pendiente de calificación',
  }
}
