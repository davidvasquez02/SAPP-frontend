import { httpGet, httpPut } from '../shared/http/httpClient'
import type { ApiResponse } from './types'

export interface RubricaEvaluacionDto {
  id: number
  tipoSolicitudCodigo: string
  nombreArchivo: string
  mimeType: string
  tamanoBytes: number
  checksum: string | null
  fechaCarga: string
  usuarioCargaId: number | null
  /** Solo viene al consultar un trámite; el listado no trae el archivo. */
  contenidoBase64?: string | null
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

/** Rubricas vigentes, una por trámite que ya tenga, sin el archivo. */
export const getRubricasEvaluacion = async (): Promise<RubricaEvaluacionDto[]> => {
  const response = await httpGet<ApiResponse<RubricaEvaluacionDto[]>>(BASE)
  return response.data ?? []
}

/** La rubrica vigente de un trámite con su archivo, o null si todavía no se ha subido. */
export const getRubricaEvaluacion = async (tipoSolicitudCodigo: string): Promise<RubricaEvaluacionDto | null> => {
  const response = await httpGet<ApiResponse<RubricaEvaluacionDto | null>>(`${BASE}/${tipoSolicitudCodigo}`)
  return response.data
}

export const actualizarRubricaEvaluacion = async (
  tipoSolicitudCodigo: string,
  payload: ActualizarRubricaRequest,
): Promise<RubricaEvaluacionDto> => {
  const response = await httpPut<ApiResponse<RubricaEvaluacionDto>>(`${BASE}/${tipoSolicitudCodigo}`, payload)
  return response.data
}
