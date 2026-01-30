import { httpGet } from '../shared/http/httpClient'
import type { ApiResponse } from './types'
import type { TramiteDocumentoDto } from './tramiteDocumentTypes'

export const getDocumentosPorTipoTramite = async (
  tipoTramiteId: number,
): Promise<TramiteDocumentoDto[]> => {
  const parsed = await httpGet<ApiResponse<TramiteDocumentoDto[]>>(
    `/sapp/tramite/document?tipoTramiteId=${tipoTramiteId}`,
  )

  if (!parsed.ok) {
    throw new Error(parsed.message || 'Consulta fallida')
  }

  return parsed.data
}
