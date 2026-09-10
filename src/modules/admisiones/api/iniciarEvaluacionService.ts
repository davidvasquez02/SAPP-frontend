import { httpPost } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'

export async function iniciarEvaluacion(inscripcionId: number): Promise<void> {
  const response = await httpPost<ApiResponse<unknown>>(
    `/sapp/evaluacionAdmision/iniciarEvaluacion/${inscripcionId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible iniciar la evaluación.')
  }
}
