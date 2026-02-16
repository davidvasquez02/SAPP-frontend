import { httpGet } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'
import type { TramiteDocumentoDto } from './tramiteDocumentoTypes'

const TIPO_TRAMITE_ID = 1

export const getTramiteDocumentos = async (): Promise<TramiteDocumentoDto[]> => {
  const response = await httpGet<ApiResponse<TramiteDocumentoDto[]>>(
    `/sapp/tramite/document?tipoTramiteId=${TIPO_TRAMITE_ID}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los documentos del trámite.')
  }

  return response.data ?? []
}
