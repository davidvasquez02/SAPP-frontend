import { httpGet } from '../shared/http/httpClient'
import type { ApiResponse } from './types'

export interface ConfiguracionIdpDto {
  url: string
}

export const getIdpAccountUrl = async (): Promise<string> => {
  const response = await httpGet<ApiResponse<ConfiguracionIdpDto>>('/configuracion/idp-account-url')
  return response.data.url
}
