import { httpGet } from '../../../shared/http/httpClient'
import { CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE } from '../constants'
import type { ApiResponse, DocumentoTramiteItemDto } from './types'

export const getDocumentosByTramite = async (
  tramiteId: number,
): Promise<DocumentoTramiteItemDto[]> => {
  const qs = new URLSearchParams({
    codigoTipoTramite: String(CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE),
    tramiteId: String(tramiteId),
  })

  const response = await httpGet<ApiResponse<DocumentoTramiteItemDto[]>>(
    `/sapp/document?${qs.toString()}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'Consulta fallida')
  }

  return response.data
}
