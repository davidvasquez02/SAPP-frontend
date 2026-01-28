import { API_BASE_URL } from './config'
import type { ApiResponse } from './types'
import type { TipoDocumentoIdentificacionDto } from './tipoDocumentoIdentificacionTypes'

export const getTiposDocumentoIdentificacion = async (): Promise<
  TipoDocumentoIdentificacionDto[]
> => {
  const response = await fetch(`${API_BASE_URL}/sapp/tipoDocumentoIdentificacion`)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const payload = (await response.json()) as ApiResponse<TipoDocumentoIdentificacionDto[]>

  if (!payload.ok) {
    throw new Error(payload.message || 'Consulta fallida')
  }

  return payload.data
}
