import { API_BASE_URL } from './config'
import type { ApiResponse } from './types'
import type { TramiteDocumentoDto } from './tramiteDocumentTypes'

export const getDocumentosPorTipoTramite = async (
  tipoTramiteId: number,
): Promise<TramiteDocumentoDto[]> => {
  const response = await fetch(
    `${API_BASE_URL}/sapp/tramite/document?tipoTramiteId=${tipoTramiteId}`,
  )

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const parsed = (await response.json()) as ApiResponse<TramiteDocumentoDto[]>

  if (!parsed.ok) {
    throw new Error(parsed.message || 'Consulta fallida')
  }

  return parsed.data
}
