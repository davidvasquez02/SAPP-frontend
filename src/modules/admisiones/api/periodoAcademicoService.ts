import type { ApiResponse } from '../../../api/types'
import { httpGet, httpPost } from '../../../shared/http/httpClient'
import type { PeriodoAcademicoDto, PeriodoAcademicoFechaRequest } from './periodoAcademicoTypes'

export const getPeriodosAcademicos = async (): Promise<PeriodoAcademicoDto[]> => {
  const response = await httpGet<ApiResponse<PeriodoAcademicoDto[]>>('/sapp/periodoAcademico')

  if (!response.ok) {
    throw new Error(response.message || 'Error al obtener periodos académicos')
  }

  return response.data ?? []
}

export const createPeriodoAcademicoFecha = async (
  request: PeriodoAcademicoFechaRequest
): Promise<void> => {
  const response = await httpPost<ApiResponse<null>>('/sapp/periodoAcademicoFecha', request)

  if (!response.ok) {
    throw new Error(response.message || 'Error al crear fechas del periodo académico')
  }
}
