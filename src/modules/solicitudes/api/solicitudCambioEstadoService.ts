import { httpPut } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'
import type { EstadoSolicitudSigla } from '../utils/estadoSolicitud'

export type SolicitudEstadoTarget = EstadoSolicitudSigla

export async function cambiarEstadoSolicitud(
  solicitudId: number,
  target: SolicitudEstadoTarget,
  options: { enviarConsejo?: boolean; actaId?: number; observaciones?: string } = {},
): Promise<void> {
  const params = new URLSearchParams({ siglaEstado: target })

  if (options.enviarConsejo !== undefined) {
    params.set('enviarConsejo', String(options.enviarConsejo))
  }

  if (options.actaId != null) {
    params.set('actaId', String(options.actaId))
  }

  if (options.observaciones !== undefined) {
    params.set('observaciones', options.observaciones)
  }

  const path = `/sapp/solicitudesAcademicas/cambioEstado/${solicitudId}?${params.toString()}`
  const response = await httpPut<ApiResponse<unknown | null>>(path)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cambiar el estado de la solicitud.')
  }
}

/** Mueve una solicitud de EN_VALIDACION_COORDINACION a ENVIADA (comite asesor), una vez validados sus requisitos. */
export async function enviarSolicitudAComite(solicitudId: number): Promise<void> {
  const response = await httpPut<ApiResponse<unknown | null>>(`/sapp/solicitudesAcademicas/${solicitudId}/enviarAComite`)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible enviar la solicitud a comite.')
  }
}
