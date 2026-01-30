import { API_BASE_URL } from '../../../api/config'
import { request } from '../../../api/httpClient'
import { CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE } from '../constants'
import type { ApiResponse, DocumentoTramiteItemDto } from './types'

export const getDocumentosByTramite = async (
  tramiteId: number,
): Promise<DocumentoTramiteItemDto[]> => {
  const qs = new URLSearchParams({
    codigoTipoTramite: String(CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE),
    tramiteId: String(tramiteId),
  })

  const response = await request<ApiResponse<DocumentoTramiteItemDto[]>>(
    `${API_BASE_URL}/sapp/document?${qs.toString()}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'Consulta fallida')
  }

  return response.data
}
