import { httpPut } from '../../../shared/http/httpClient'
import type { ApiResponse, SolicitudAcademicaDto } from './types'

export type SolicitudEstadoTarget = 'EN_ESTUDIO' | 'APROBADA' | 'RECHAZADA'

const ENDPOINT_BY_TARGET: Record<SolicitudEstadoTarget, string> = {
  EN_ESTUDIO: 'cambioEstadoEnEstudio',
  APROBADA: 'cambioEstadoAprobada',
  RECHAZADA: 'cambioEstadoRechazada',
}

export async function cambiarEstadoSolicitud(
  solicitudId: number,
  target: SolicitudEstadoTarget,
): Promise<void | SolicitudAcademicaDto> {
  const endpoint = ENDPOINT_BY_TARGET[target]
  const response = await httpPut<ApiResponse<SolicitudAcademicaDto | null>>(
    `/sapp/solicitudesAcademicas/${endpoint}/${solicitudId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cambiar el estado de la solicitud.')
  }

  return response.data ?? undefined
}
