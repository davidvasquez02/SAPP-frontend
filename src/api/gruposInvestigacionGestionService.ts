import { httpGet, httpPost, httpPut } from '../shared/http/httpClient'
import type { ApiResponse } from './types'
import type {
  GrupoGestionDto,
  GrupoGestionRequest,
  InstitucionGrupoDto,
} from './gruposInvestigacionGestionTypes'

const GESTION_BASE = '/sapp/gruposInvestigacion/gestion'

export const getGruposGestion = async (): Promise<GrupoGestionDto[]> => {
  const response = await httpGet<ApiResponse<GrupoGestionDto[]>>(`${GESTION_BASE}/grupos`)
  return response.data ?? []
}

export const crearGrupoGestion = async (request: GrupoGestionRequest): Promise<GrupoGestionDto> => {
  const response = await httpPost<ApiResponse<GrupoGestionDto>>(`${GESTION_BASE}/grupos`, request)
  return response.data
}

export const modificarGrupoGestion = async (
  id: number,
  request: GrupoGestionRequest,
): Promise<GrupoGestionDto> => {
  const response = await httpPut<ApiResponse<GrupoGestionDto>>(`${GESTION_BASE}/grupos/${id}`, request)
  return response.data
}

export const desactivarGrupoGestion = async (id: number): Promise<GrupoGestionDto> => {
  const response = await httpPut<ApiResponse<GrupoGestionDto>>(`${GESTION_BASE}/grupos/${id}/desactivar`)
  return response.data
}

export const getInstitucionesGrupo = async (): Promise<InstitucionGrupoDto[]> => {
  const response = await httpGet<ApiResponse<InstitucionGrupoDto[]>>(`${GESTION_BASE}/instituciones`)
  return response.data ?? []
}

export const crearInstitucionGrupo = async (nombre: string): Promise<InstitucionGrupoDto> => {
  const response = await httpPost<ApiResponse<InstitucionGrupoDto>>(`${GESTION_BASE}/instituciones`, { nombre })
  return response.data
}
