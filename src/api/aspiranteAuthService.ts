import { API_BASE_URL } from './config'
import type { AspiranteConsultaInfoDto } from './aspiranteConsultaTypes'
import type { ApiResponse } from './types'

export interface AspiranteLoginParams {
  numeroInscripcion: string
  tipoDocumentoId: number
  numeroDocumento: string
}

export const consultaInfoAspirante = async (
  params: AspiranteLoginParams,
): Promise<AspiranteConsultaInfoDto> => {
  const qs = new URLSearchParams({
    numeroInscripcion: params.numeroInscripcion,
    tipoDocumentoId: String(params.tipoDocumentoId),
    numeroDocumento: params.numeroDocumento,
  })
  const url = `${API_BASE_URL}/sapp/aspirante/consultaInfo?${qs.toString()}`

  const response = await fetch(url, { method: 'GET' })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const parsed = (await response.json()) as ApiResponse<AspiranteConsultaInfoDto>
  if (!parsed.ok) {
    throw new Error(parsed.message || 'Consulta fallida')
  }

  return parsed.data
}
