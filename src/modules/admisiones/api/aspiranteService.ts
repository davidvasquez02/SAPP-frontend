import { httpGet, httpPost } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'
import type {
  AspiranteCreateRequestDto,
  AspiranteCreateResponseDto,
  AspiranteConsultaResponseDto,
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

export const getNombreCompletoAspirante = (aspirante: AspiranteConsultaResponseDto): string =>
  [aspirante.nombre1, aspirante.nombre2, aspirante.apellido1, aspirante.apellido2]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => Boolean(parte))
    .join(' ')

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
