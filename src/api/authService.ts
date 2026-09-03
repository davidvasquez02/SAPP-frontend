import { API_URL } from './config'
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

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

/** Asks the gateway to invalidate server-side/HttpOnly session state. */
export const logoutFromGateway = async (): Promise<void> => {
  const logoutUrl = import.meta.env.VITE_LOGOUT_URL ?? `${trimTrailingSlash(API_URL)}/logout`

  await fetch(logoutUrl, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    keepalive: true,
    redirect: 'follow',
  })
}
