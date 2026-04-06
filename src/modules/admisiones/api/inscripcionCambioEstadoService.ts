import { httpPut } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'

export async function cambiarEstadoInscripcionVal(
  inscripcionId: number,
): Promise<void | unknown> {
  const response = await httpPut<ApiResponse<unknown>>(
    `/sapp/inscripcionAdmision/cambioEstadoVal/${inscripcionId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible actualizar el estado de la inscripción.')
  }

  return response.data
}
