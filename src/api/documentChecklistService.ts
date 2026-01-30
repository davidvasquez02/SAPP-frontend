import { httpGet } from '../shared/http/httpClient'
import type { DocumentChecklistItemDto } from './documentChecklistTypes'
import type { ApiResponse } from './types'

interface ChecklistParams {
  codigoTipoTramite: number
  tramiteId: number
}

export const getChecklistDocumentos = async ({
  codigoTipoTramite,
  tramiteId,
}: ChecklistParams): Promise<DocumentChecklistItemDto[]> => {
  const qs = new URLSearchParams({
    codigoTipoTramite: String(codigoTipoTramite),
    tramiteId: String(tramiteId),
  })

  const parsed = await httpGet<ApiResponse<DocumentChecklistItemDto[]>>(
    `/sapp/document?${qs.toString()}`,
  )

  if (!parsed.ok) {
    throw new Error(parsed.message || 'Consulta fallida')
  }

  return parsed.data
}
