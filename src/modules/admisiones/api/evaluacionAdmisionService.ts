import { httpGet, httpPut } from '../../../shared/http/httpClient'
import type { EvaluacionAdmisionItem, EtapaEvaluacion } from '../types/evaluacionAdmisionTypes'
import { normalizeEntrevistasPorEvaluador } from '../utils/normalizeEntrevistasPorEvaluador'
import type { ApiResponse } from './types'

export const getEvaluacionAdmisionInfo = async (
  inscripcionId: number,
  etapa: EtapaEvaluacion,
): Promise<EvaluacionAdmisionItem[]> => {
  const response = await httpGet<ApiResponse<EvaluacionAdmisionItem[]>>(
    `/sapp/evaluacionAdmision/info?inscripcionId=${inscripcionId}&etapa=${etapa}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al obtener la evaluación de admisión')
  }

  return response.data ?? []
}

export interface EntrevistaPorEvaluadorDto {
  inscripcionId: number
  completa: boolean
}

export const getEntrevistasPorEvaluador = async (
  evaluadorId: number,
): Promise<EntrevistaPorEvaluadorDto[]> => {
  const response = await httpGet<ApiResponse<EntrevistaPorEvaluadorDto[] | null>>(
    `/sapp/evaluacionAdmision/entrevistasPorEvaluador?evaluadorId=${encodeURIComponent(evaluadorId)}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al obtener las entrevistas del evaluador')
  }

  return normalizeEntrevistasPorEvaluador(response.data)
}

export interface RegistroPuntajeUpdateItem {
  id: number
  puntajeAspirante: number | null
  observaciones: string | null
}

export const updateEvaluacionRegistroPuntaje = async (
  updates: RegistroPuntajeUpdateItem[],
): Promise<void> => {
  const response = await httpPut<ApiResponse<unknown>>(
    '/sapp/evaluacionAdmision/registroPuntaje',
    updates,
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al actualizar puntajes de evaluación')
  }
}
