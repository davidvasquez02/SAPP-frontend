import { httpGet } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'

export type EvaluacionEstadoResult =
  | { status: 'NOT_STARTED'; message: string }
  | { status: 'STARTED' }

export async function getEvaluacionEstado(
  inscripcionId: number,
): Promise<EvaluacionEstadoResult> {
  const response = await httpGet<ApiResponse<unknown>>(
    `/sapp/evaluacionAdmision/info?inscripcionId=${inscripcionId}`,
  )

  if (response.ok === true) {
    return { status: 'STARTED' }
  }

  if (response.ok === false && response.data == null) {
    return {
      status: 'NOT_STARTED',
      message: response.message || 'No se ha iniciado proceso de evaluación.',
    }
  }

  throw new Error(response.message || 'No fue posible validar el estado de la evaluación.')
}
