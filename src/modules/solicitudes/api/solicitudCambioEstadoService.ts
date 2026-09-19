import { httpPut } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'
import type { EstadoSolicitudSigla } from '../utils/estadoSolicitud'

export type SolicitudEstadoTarget = EstadoSolicitudSigla

export async function cambiarEstadoSolicitud(
  solicitudId: number,
  target: SolicitudEstadoTarget,
  options: { enviarConsejo?: boolean; actaId?: number } = {},
): Promise<void> {
  const params = new URLSearchParams({ siglaEstado: target })

  if (options.enviarConsejo === true) {
    params.set('enviarConsejo', 'true')
  }

  if (options.actaId != null) {
    params.set('actaId', String(options.actaId))
  }

  const path = `/sapp/solicitudesAcademicas/cambioEstado/${solicitudId}?${params.toString()}`
  const response = await httpPut<ApiResponse<unknown | null>>(path)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cambiar el estado de la solicitud.')
  }
}
