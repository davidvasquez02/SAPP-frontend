import type { ApiResponse } from '../../../api/types'
import { http } from '../../../shared/http/httpClient'
import type {
  CreatePeriodoAcademicoRequestDto,
  PeriodoAcademicoDto,
  PeriodoAcademicoWithFechasDto,
  UpdatePeriodoAcademicoRequestDto,
} from './types'

export async function getPeriodosAcademicos(): Promise<PeriodoAcademicoDto[]> {
  const response = await http<ApiResponse<PeriodoAcademicoDto[]>>('/sapp/periodoAcademico', {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los periodos académicos')
  }

  return response.data ?? []
}

export async function getPeriodosAcademicosWithFechas(): Promise<PeriodoAcademicoWithFechasDto[]> {
  const response = await http<ApiResponse<PeriodoAcademicoWithFechasDto[]>>(
    '/  sapp/periodoAcademico/withFechas',
    {
      method: 'GET',
    }
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los periodos con fechas')
  }

  return response.data ?? []
}

export async function createPeriodoAcademico(request: CreatePeriodoAcademicoRequestDto): Promise<void> {
  const response = await http<ApiResponse<null>>('/sapp/periodoAcademico', {
    method: 'POST',
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible crear el periodo académico')
  }
}

export async function updatePeriodoAcademico(
  periodoId: number,
  request: UpdatePeriodoAcademicoRequestDto
): Promise<void> {
  const response = await http<ApiResponse<null>>(`/sapp/periodoAcademico/${periodoId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible actualizar el periodo académico')
  }
}
