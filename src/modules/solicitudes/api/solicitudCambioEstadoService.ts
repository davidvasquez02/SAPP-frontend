import { httpPut } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'

export type SolicitudEstadoTarget = 'EN_ESTUDIO' | 'APROBADA' | 'RECHAZADA'

export type CambioEstadoBatchRequest = {
  solicitudesId: number[]
}

export async function cambiarEstadoSolicitud(
  solicitudId: number,
  target: SolicitudEstadoTarget,
): Promise<void> {
  let path = ''
  let body: string | undefined

  switch (target) {
    case 'EN_ESTUDIO':
      path = `/sapp/solicitudesAcademicas/cambioEstadoEnEstudio/${solicitudId}`
      break
    case 'APROBADA': {
      path = '/sapp/solicitudesAcademicas/cambioEstadoAprobada'
      const request: CambioEstadoBatchRequest = { solicitudesId: [solicitudId] }
      body = JSON.stringify(request)
      break
    }
    case 'RECHAZADA': {
      path = '/sapp/solicitudesAcademicas/cambioEstadoRechazada'
      const request: CambioEstadoBatchRequest = { solicitudesId: [solicitudId] }
      body = JSON.stringify(request)
      break
    }
    default:
      path = `/sapp/solicitudesAcademicas/cambioEstadoEnEstudio/${solicitudId}`
  }

  const response = await httpPut<ApiResponse<unknown | null>>(path, {
    ...(body
      ? {
        headers: { 'Content-Type': 'application/json' },
        body,
      }
      : {}),
  })

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cambiar el estado de la solicitud.')
  }
}
