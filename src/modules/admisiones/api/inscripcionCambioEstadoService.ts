import { httpPut } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'

export async function cambiarEstadoInscripcionVal(
  inscripcionId: number,
): Promise<void> {
  const response = await httpPut<ApiResponse<unknown>>(
    `/sapp/inscripcionAdmision/cambioEstadoVal/${inscripcionId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible actualizar el estado de la inscripción.')
  }
}

export async function cambiarEstadoInscripcionPorVal(
  inscripcionId: number,
): Promise<void> {
  const response = await httpPut<ApiResponse<unknown>>(
    `/sapp/inscripcionAdmision/cambioEstadoPorVal/${inscripcionId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible actualizar el estado de la inscripción.')
  }
}
