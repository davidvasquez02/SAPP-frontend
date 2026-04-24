import { httpGet } from '../shared/http/httpClient'
import type { ApiResponse } from './types'
import type { TipoDocumentoIdentificacionDto } from './tipoDocumentoIdentificacionTypes'

export const getTiposDocumentoIdentificacion = async (): Promise<
  TipoDocumentoIdentificacionDto[]
> => {
  const payload = await httpGet<ApiResponse<TipoDocumentoIdentificacionDto[]>>(
    '/sapp/tipoDocumentoIdentificacion',
  )

  if (!payload.ok) {
    throw new Error(payload.message || 'Consulta fallida')
  }

  return payload.data
}
