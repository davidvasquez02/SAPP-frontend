import { API_BASE_URL } from './config'
import type { DocumentChecklistItemDto } from './documentChecklistTypes'
import type { ApiResponse } from './types'

interface ChecklistParams {
  nombreTipoTramite: string
  tramiteId: number
}

export const getChecklistDocumentos = async ({
  nombreTipoTramite,
  tramiteId,
}: ChecklistParams): Promise<DocumentChecklistItemDto[]> => {
  const qs = new URLSearchParams({
    nombreTipoTramite,
    tramiteId: String(tramiteId),
  })

  const response = await fetch(`${API_BASE_URL}/sapp/document?${qs.toString()}`)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const parsed = (await response.json()) as ApiResponse<DocumentChecklistItemDto[]>

  if (!parsed.ok) {
    throw new Error(parsed.message || 'Consulta fallida')
  }

  return parsed.data
}
