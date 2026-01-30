import { httpGet } from '../../../shared/http/httpClient'
import type { ApiResponse, InscripcionAdmisionDto } from './types'

export const getInscripcionesByConvocatoria = async (
  convocatoriaId: number
): Promise<InscripcionAdmisionDto[]> => {
  const response = await httpGet<ApiResponse<InscripcionAdmisionDto[]>>(
    `/sapp/inscripcionAdmision/convocatoria/${convocatoriaId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al obtener las inscripciones')
  }

  return response.data
}
