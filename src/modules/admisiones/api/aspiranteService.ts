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
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible crear el aspirante')
  }

  return response.data
}
