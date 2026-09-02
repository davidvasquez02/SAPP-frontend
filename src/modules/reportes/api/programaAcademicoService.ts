import type { ApiResponse } from '../../../api/types'
import { httpGet } from '../../../shared/http/httpClient'

export interface ProgramaAcademicoDto {
  id: number
  nombre: string
  codigoNombre: string
}

export const getProgramasAcademicos = async (): Promise<ProgramaAcademicoDto[]> => {
  const response = await httpGet<ApiResponse<ProgramaAcademicoDto[]>>('/sapp/programaAcademico')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los programas académicos.')
  }

  return response.data ?? []
}
