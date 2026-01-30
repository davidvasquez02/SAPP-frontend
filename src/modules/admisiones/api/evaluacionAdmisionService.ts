import { httpGet } from '../../../shared/http/httpClient'
import type { EvaluacionAdmisionItem, EtapaEvaluacion } from '../types/evaluacionAdmisionTypes'
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
