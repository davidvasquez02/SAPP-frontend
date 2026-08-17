import { httpPost } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'
import type {
  AspiranteCreateRequestDto,
  AspiranteCreateResponseDto,
} from './aspiranteCreateTypes'

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
