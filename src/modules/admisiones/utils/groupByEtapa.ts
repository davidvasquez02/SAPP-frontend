import type { EvaluacionAdmisionItem, EtapaEvaluacion } from '../types/evaluacionAdmisionTypes'

const createEmptyGroup = (): Record<EtapaEvaluacion, EvaluacionAdmisionItem[]> => ({
  HOJA_DE_VIDA: [],
  EXAMEN_DE_CONOCIMIENTOS: [],
  ENTREVISTA: [],
})

export const groupByEtapa = (
  items: EvaluacionAdmisionItem[],
): Record<EtapaEvaluacion, EvaluacionAdmisionItem[]> => {
  return items.reduce((accumulator, item) => {
    accumulator[item.etapaEvaluacion].push(item)
    return accumulator
  }, createEmptyGroup())
}
