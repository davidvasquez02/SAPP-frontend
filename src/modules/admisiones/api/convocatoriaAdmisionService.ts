import { httpGet } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'
import type { ConvocatoriaAdmisionDto } from './convocatoriaAdmisionTypes'

export const getConvocatoriasAdmision = async (): Promise<ConvocatoriaAdmisionDto[]> => {
  const response = await httpGet<ApiResponse<ConvocatoriaAdmisionDto[]>>(
    '/sapp/convocatoriaAdmision'
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al obtener las convocatorias')
  }

  return response.data ?? []
}
