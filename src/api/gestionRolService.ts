import { httpGet, httpPost } from '../shared/http/httpClient'
import type { ApiResponse } from './types'
import type { GestionRolRequest, UsuarioIamDto } from './gestionRolTypes'

const BASE = '/sapp/gestionRoles'

export const buscarUsuariosIam = async (q: string): Promise<UsuarioIamDto[]> => {
  const params = new URLSearchParams({ q })
  const response = await httpGet<ApiResponse<UsuarioIamDto[]>>(`${BASE}/usuarios?${params.toString()}`)
  return response.data ?? []
}

export const getRolesDeUsuarioIam = async (uuid: string): Promise<string[]> => {
  const response = await httpGet<ApiResponse<string[]>>(`${BASE}/usuarios/${encodeURIComponent(uuid)}/roles`)
  return response.data ?? []
}

export const getRolesGestionables = async (): Promise<string[]> => {
  const response = await httpGet<ApiResponse<string[]>>(`${BASE}/gestionables`)
  return response.data ?? []
}

export const asignarRolIam = async (request: GestionRolRequest): Promise<void> => {
  await httpPost<ApiResponse<unknown>>(`${BASE}/asignar`, request)
}

export const retirarRolIam = async (request: GestionRolRequest): Promise<void> => {
  await httpPost<ApiResponse<unknown>>(`${BASE}/retirar`, request)
}
