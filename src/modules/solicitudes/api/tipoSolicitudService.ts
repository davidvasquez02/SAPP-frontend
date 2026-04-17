import { httpGet } from '../../../shared/http/httpClient'
import type { ApiResponse, TipoSolicitudDto } from './types'

const normalizeTipoSolicitud = (tipo: TipoSolicitudDto): TipoSolicitudDto => ({
  ...tipo,
  tipoTramiteId: tipo.tipoTramiteId ?? tipo.tramiteId ?? null,
})

export async function getTiposSolicitud(): Promise<TipoSolicitudDto[]> {
  const response = await httpGet<ApiResponse<TipoSolicitudDto[]>>('/sapp/tipoSolicitud')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los tipos de solicitud.')
  }

  return (response.data ?? []).map(normalizeTipoSolicitud)
}
