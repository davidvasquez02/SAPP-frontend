import { httpGet, httpPut } from '../shared/http/httpClient'
import type { ApiResponse } from './types'

export interface RubricaEvaluacionDto {
  id: number
  nombreArchivo: string
  mimeType: string
  tamanoBytes: number
  checksum: string | null
  fechaCarga: string
  usuarioCargaId: number | null
  contenidoBase64: string
}

export interface ActualizarRubricaRequest {
  nombreArchivo: string
  contenidoBase64: string
  mimeType: string
  tamanoBytes: number
  checksum: string
  usuarioCargaId: number
}

const BASE = '/rubrica-evaluacion'

export const getRubricaEvaluacion = async (): Promise<RubricaEvaluacionDto | null> => {
  const response = await httpGet<ApiResponse<RubricaEvaluacionDto | null>>(BASE)
  return response.data
}

export const actualizarRubricaEvaluacion = async (
  payload: ActualizarRubricaRequest,
): Promise<RubricaEvaluacionDto> => {
  const response = await httpPut<ApiResponse<RubricaEvaluacionDto>>(BASE, payload)
  return response.data
}
