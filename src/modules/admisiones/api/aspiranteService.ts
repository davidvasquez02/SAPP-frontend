import { httpGet, httpPost } from '../../../shared/http/httpClient'
import { fileToBase64 } from '../../../utils/fileToBase64'
import type { ApiResponse } from './types'
import type {
  AspiranteCreateRequestDto,
  AspiranteCreateResponseDto,
  AspiranteConsultaResponseDto,
  ImportacionAspirantesExcelDto,
} from './aspiranteCreateTypes'

const unwrapAspiranteResponse = <T>(response: ApiResponse<T>, fallbackMessage: string): T => {
  if (!response.ok) {
    throw new Error(response.message || fallbackMessage)
  }

  return response.data
}

export const getAspirantes = async (): Promise<AspiranteConsultaResponseDto[]> => {
  const response = await httpGet<ApiResponse<AspiranteConsultaResponseDto[]>>(
    '/sapp/aspirante',
  )

  return unwrapAspiranteResponse(response, 'No fue posible consultar los aspirantes')
}

export const getAspiranteById = async (
  aspiranteId: number,
): Promise<AspiranteConsultaResponseDto> => {
  const response = await httpGet<ApiResponse<AspiranteConsultaResponseDto>>(
    `/sapp/aspirante/${aspiranteId}`,
  )

  return unwrapAspiranteResponse(response, 'No fue posible consultar el aspirante')
}

export const getAspiranteConsultaInfo = async (): Promise<AspiranteConsultaResponseDto> => {
  const response = await httpGet<ApiResponse<AspiranteConsultaResponseDto>>(
    '/sapp/aspirante/consultaInfo',
  )

  return unwrapAspiranteResponse(response, 'No fue posible consultar la información del aspirante')
}

export const createAspirante = async (
  req: AspiranteCreateRequestDto
): Promise<AspiranteCreateResponseDto> => {
  const response = await httpPost<ApiResponse<AspiranteCreateResponseDto>>(
    '/sapp/aspirante',
    req,
    // A validation/authorization failure belongs to this form. Keep the current
    // session and route so coordination can see the backend error and correct it.
    { redirectOnUnauthorized: false },
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible crear el aspirante')
  }

  return response.data
}

/**
 * Lee el Excel de aspirantes en el backend y devuelve una fila por aspirante, lista para crear con
 * {@link createAspirante} o con los errores que la impiden. No crea nada.
 */
export const leerExcelAspirantes = async (
  file: File,
  convocatoriaAdmisionId: number,
): Promise<ImportacionAspirantesExcelDto> => {
  const response = await httpPost<ApiResponse<ImportacionAspirantesExcelDto>>(
    '/sapp/aspirante/importar-excel',
    {
      contenidoBase64: await fileToBase64(file),
      nombreArchivo: file.name,
      convocatoriaAdmisionId,
    },
    { redirectOnUnauthorized: false },
  )

  return unwrapAspiranteResponse(response, 'No fue posible leer el archivo de aspirantes')
}
