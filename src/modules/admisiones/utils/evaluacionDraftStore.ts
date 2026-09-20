import type { EtapaEvaluacion } from '../types/evaluacionAdmisionTypes'
import type { EvaluacionDraft } from '../components/EvaluacionEtapaSection/EvaluacionEtapaSection'

const draftsByStage = new Map<string, Record<number, EvaluacionDraft>>()

const keyFor = (inscripcionId: number, etapa: EtapaEvaluacion) => `${inscripcionId}-${etapa}`

export const getEvaluationDrafts = (inscripcionId: number, etapa: EtapaEvaluacion) =>
  draftsByStage.get(keyFor(inscripcionId, etapa)) ?? {}

export const setEvaluationDrafts = (
  inscripcionId: number,
  etapa: EtapaEvaluacion,
  drafts: Record<number, EvaluacionDraft>,
) => draftsByStage.set(keyFor(inscripcionId, etapa), drafts)

export const clearEvaluationDrafts = (inscripcionId: number, etapa: EtapaEvaluacion) =>
  draftsByStage.delete(keyFor(inscripcionId, etapa))

export const hasEvaluationDrafts = (inscripcionId: number) =>
  [...draftsByStage.entries()].some(
    ([key, drafts]) => key.startsWith(`${inscripcionId}-`) && Object.keys(drafts).length > 0,
  )
