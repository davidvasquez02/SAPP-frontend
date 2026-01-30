import { API_BASE_URL } from '../../../api/config'
import { request } from '../../../api/httpClient'
import type { ApiResponse, InscripcionAdmisionDto } from './types'

export const getInscripcionesByConvocatoria = async (
  convocatoriaId: number
): Promise<InscripcionAdmisionDto[]> => {
  const response = await request<ApiResponse<InscripcionAdmisionDto[]>>(
    `${API_BASE_URL}/sapp/inscripcionAdmision/convocatoria/${convocatoriaId}`,
    {
      skipAuth: true,
    }
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al obtener las inscripciones')
  }

  return response.data
}
