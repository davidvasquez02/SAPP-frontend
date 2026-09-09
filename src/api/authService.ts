import { httpGet } from '../shared/http/httpClient'
import type { GatewayLoginResponseDto } from './authTypes'
import type { ApiResponse } from './types'

/** Initializes the SAPP session from the identity already captured by the gateway. */
export const loginFromGateway = async (): Promise<GatewayLoginResponseDto> => {
  const response = await httpGet<ApiResponse<GatewayLoginResponseDto>>('/inicio', {
    auth: false,
    redirectOnUnauthorized: false,
  })

  if (!response.ok || !response.data) {
    throw new Error(response.message || 'No fue posible obtener la sesión institucional')
  }

  return response.data
}

/** Resolves the front-channel logout/restart URL handled by the identity provider or gateway. */
export const getLogoutRedirectUrl = (): string =>
  import.meta.env.VITE_IDP_LOGOUT_URL ?? import.meta.env.VITE_LOGOUT_URL ?? '/'
