import type { ApiResponse } from '../../../api/types'
import { http } from '../../../shared/http/httpClient'
import type { ConvocatoriaApiDto, InscripcionApiDto } from './types'

export async function getConvocatoriasApi(): Promise<ConvocatoriaApiDto[]> {
  const response = await http<ApiResponse<ConvocatoriaApiDto[]>>('/api/sapp/convocatoriaAdmision')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible obtener convocatorias de admisión.')
  }

  return response.data ?? []
}

export async function getInscripcionesByConvocatoria(
  convocatoriaId: number
): Promise<InscripcionApiDto[]> {
  const response = await http<ApiResponse<InscripcionApiDto[]>>(
    `/api/sapp/inscripcionAdmision/convocatoria/${convocatoriaId}`
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible obtener las inscripciones de la convocatoria.')
  }

  return response.data ?? []
}
