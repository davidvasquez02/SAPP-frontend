import { httpPut } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'

export interface AprobarRechazarDocumentoRequest {
  documentoId: number
  aprobado: boolean
  observaciones?: string | null
}

export const aprobarRechazarDocumento = async (
  req: AprobarRechazarDocumentoRequest,
): Promise<void> => {
  const response = await httpPut<ApiResponse<unknown>>('/sapp/document', req, { auth: true })

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible actualizar el documento.')
  }
}

/** Devuelve un documento aprobado o rechazado a "por revisar" (para corregir una decisión equivocada). */
export const deshacerDecisionDocumento = async (documentoId: number): Promise<void> => {
  const response = await httpPut<ApiResponse<unknown>>(
    `/sapp/document/${documentoId}/deshacer-decision`,
    undefined,
    { auth: true },
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible deshacer la decisión.')
  }
}
