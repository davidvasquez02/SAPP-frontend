import { httpPost } from '../shared/http/httpClient'
import type { GatewayLoginResponseDto } from './authTypes'
import type { ApiResponse } from './types'

/** Initializes the SAPP session from the identity already captured by the gateway. */
export const loginFromGateway = async (): Promise<GatewayLoginResponseDto> => {
  const response = await httpPost<ApiResponse<GatewayLoginResponseDto>>('/inicio', undefined, {
    auth: false,
    redirectOnUnauthorized: false,
  })

  if (!response.ok || !response.data) {
    throw new Error(response.message || 'No fue posible obtener la sesión institucional')
  }

  return response.data
}
