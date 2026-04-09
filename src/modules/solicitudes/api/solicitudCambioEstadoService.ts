import { httpPut } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'

export type SolicitudEstadoTarget = 'EN_REVISION' | 'APROBADA' | 'RECHAZADA'

export async function cambiarEstadoSolicitud(
  solicitudId: number,
  target: SolicitudEstadoTarget,
): Promise<void> {
  const encodedTarget = encodeURIComponent(target)
  const path = `/sapp/solicitudesAcademicas/cambioEstado/${solicitudId}?siglaEstado=${encodedTarget}`
  const response = await httpPut<ApiResponse<unknown | null>>(path)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cambiar el estado de la solicitud.')
  }
}
