import { httpPut } from '../shared/http/httpClient'
import type { ApiResponse } from './types'

export interface AspiranteInvestigacionUpdateRequestDto {
  id: number
  grupoInvestigacionId: number
  directorId: number
}

export const updateAspiranteInvestigacion = async (
  req: AspiranteInvestigacionUpdateRequestDto,
): Promise<void> => {
  const response = await httpPut<ApiResponse<unknown>>('/sapp/aspirante', req)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible actualizar la información de investigación.')
  }
}
