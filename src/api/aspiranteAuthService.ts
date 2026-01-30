import { httpGet } from '../shared/http/httpClient'
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
  const parsed = await httpGet<ApiResponse<AspiranteConsultaInfoDto>>(
    `/sapp/aspirante/consultaInfo?${qs.toString()}`,
    { auth: false },
  )
  if (!parsed.ok) {
    throw new Error(parsed.message || 'Consulta fallida')
  }

  return parsed.data
}
