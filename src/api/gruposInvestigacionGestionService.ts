import { httpGet, httpPost, httpPut } from '../shared/http/httpClient'
import type { ApiResponse } from './types'
import type {
  GrupoGestionDto,
  GrupoGestionRequest,
  InstitucionGrupoDto,
  InstitucionGrupoRequest,
  TipoInstitucionGrupo,
} from './gruposInvestigacionGestionTypes'

const GESTION_BASE = '/sapp/gruposInvestigacion/gestion'

export interface FiltrosGruposGestion {
  busqueda?: string
  institucionId?: number
  estado?: string
}

export const getGruposGestion = async (filtros: FiltrosGruposGestion = {}): Promise<GrupoGestionDto[]> => {
  const params = new URLSearchParams()
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda)
  if (filtros.institucionId !== undefined) params.set('institucionId', String(filtros.institucionId))
  if (filtros.estado) params.set('estado', filtros.estado)
  const query = params.toString()
  const response = await httpGet<ApiResponse<GrupoGestionDto[]>>(`${GESTION_BASE}/grupos${query ? `?${query}` : ''}`)
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

export const reactivarGrupoGestion = async (id: number): Promise<GrupoGestionDto> => {
  const response = await httpPut<ApiResponse<GrupoGestionDto>>(`${GESTION_BASE}/grupos/${id}/reactivar`)
  return response.data
}

export interface FiltrosInstitucionesGrupo {
  busqueda?: string
  tipo?: TipoInstitucionGrupo
  facultadId?: number
  sinFacultad?: boolean
}

export interface PaginaInstitucionesGrupo {
  content: InstitucionGrupoDto[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

/** Listado paginado de facultades y escuelas, con filtros opcionales (los filtra el back). */
export const getInstitucionesPaginadas = async (
  filtros: FiltrosInstitucionesGrupo,
  page: number,
  size: number,
): Promise<PaginaInstitucionesGrupo> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda)
  if (filtros.tipo) params.set('tipo', filtros.tipo)
  if (filtros.facultadId !== undefined) params.set('facultadId', String(filtros.facultadId))
  if (filtros.sinFacultad) params.set('sinFacultad', 'true')
  const response = await httpGet<ApiResponse<PaginaInstitucionesGrupo>>(`${GESTION_BASE}/instituciones?${params.toString()}`)
  return response.data
}

/** Lista liviana para selectores (facultades o escuelas), ordenada por nombre. */
export const getOpcionesInstituciones = async (tipo?: TipoInstitucionGrupo): Promise<InstitucionGrupoDto[]> => {
  const query = tipo ? `?tipo=${tipo}` : ''
  const response = await httpGet<ApiResponse<InstitucionGrupoDto[]>>(`${GESTION_BASE}/instituciones/opciones${query}`)
  return response.data ?? []
}

export const crearInstitucionGrupo = async (request: InstitucionGrupoRequest): Promise<InstitucionGrupoDto> => {
  const response = await httpPost<ApiResponse<InstitucionGrupoDto>>(`${GESTION_BASE}/instituciones`, request)
  return response.data
}

export const modificarInstitucionGrupo = async (
  id: number,
  request: InstitucionGrupoRequest,
): Promise<InstitucionGrupoDto> => {
  const response = await httpPut<ApiResponse<InstitucionGrupoDto>>(`${GESTION_BASE}/instituciones/${id}`, request)
  return response.data
}
