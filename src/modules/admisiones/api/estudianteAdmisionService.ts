import { httpPost } from '../../../shared/http/httpClient'
import type {
  AdmitirEstudiantePayload,
  ApiResponse,
  EstudianteCreadoDto,
} from './types'

export const admitirAspiranteComoEstudiante = async (
  payload: AdmitirEstudiantePayload,
): Promise<EstudianteCreadoDto> => {
  const response = await httpPost<ApiResponse<EstudianteCreadoDto>>('/api/v1/estudiantes', payload)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible admitir al aspirante como estudiante.')
  }

  return response.data
}
