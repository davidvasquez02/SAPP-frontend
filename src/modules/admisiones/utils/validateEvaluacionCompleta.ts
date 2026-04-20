import { getEvaluacionAdmisionInfo } from '../api/evaluacionAdmisionService'

export type EtapaEvaluacion = 'HOJA_DE_VIDA' | 'EXAMEN_DE_CONOCIMIENTOS' | 'ENTREVISTA'

export type EvaluacionCompletaResult =
  | { ok: true }
  | { ok: false; reasons: string[] }

const ETAPAS: EtapaEvaluacion[] = [
  'HOJA_DE_VIDA',
  'EXAMEN_DE_CONOCIMIENTOS',
  'ENTREVISTA',
]

export async function validateEvaluacionCompleta(
  inscripcionId: number,
): Promise<EvaluacionCompletaResult> {
  const reasons: string[] = []

  for (const etapa of ETAPAS) {
    try {
      const items = await getEvaluacionAdmisionInfo(inscripcionId, etapa)

      if (items.length === 0) {
        reasons.push(`La etapa ${etapa} no tiene componentes.`)
        continue
      }

      const hasInvalidScores = items.some((item) => {
        const puntaje = item.puntajeAspirante
        const puntajeMax = Number(item.puntajeMax)

        if (typeof puntaje !== 'number' || Number.isNaN(puntaje)) {
          return true
        }

        if (!Number.isFinite(puntajeMax) || puntajeMax < 0) {
          return true
        }

        return puntaje < 0 || puntaje > puntajeMax
      })

      if (hasInvalidScores) {
        reasons.push(`Faltan puntajes o hay puntajes fuera de rango en ${etapa}.`)
      }
    } catch {
      reasons.push(`La etapa ${etapa} no está iniciada o no tiene datos.`)
    }
  }

  if (reasons.length === 0) {
    return { ok: true }
  }

  return { ok: false, reasons }
}
