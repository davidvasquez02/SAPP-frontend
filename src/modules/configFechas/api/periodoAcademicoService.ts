import type { ApiResponse } from '../../../api/types'
import { http } from '../../../shared/http/httpClient'
import type { PeriodoAcademicoDto } from './types'

export async function getPeriodosAcademicos(): Promise<PeriodoAcademicoDto[]> {
  const response = await http<ApiResponse<PeriodoAcademicoDto[]>>('/api/sapp/periodoAcademico', {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los periodos académicos')
  }

  return response.data ?? []
}
