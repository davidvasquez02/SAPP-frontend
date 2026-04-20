import { httpGet } from '../../../shared/http/httpClient'
import { CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE } from '../constants'
import type { ApiResponse, DocumentoTramiteItemDto } from './types'

interface DocumentosByTramiteParams {
  tramiteId: number
  codigoTipoTramite: string | number
}

export const getDocumentosByTramiteParams = async ({
  tramiteId,
  codigoTipoTramite,
}: DocumentosByTramiteParams): Promise<DocumentoTramiteItemDto[]> => {
  const qs = new URLSearchParams({
    codigoTipoTramite: String(codigoTipoTramite),
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

export const getDocumentosByTramite = async (
  tramiteId: number,
): Promise<DocumentoTramiteItemDto[]> => {
  return getDocumentosByTramiteParams({
    tramiteId,
    codigoTipoTramite: CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE,
  })
}
