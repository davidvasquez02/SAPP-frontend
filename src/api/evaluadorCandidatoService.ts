import { httpGet, httpPost, httpPut } from '../shared/http/httpClient'
import type { ApiResponse } from './types'
import type { EvaluadorCandidatoDto, EvaluadorCandidatoRequest } from './evaluadorCandidatoTypes'

const BASE = '/sapp/evaluadorCandidato'

export interface FiltrosEvaluadorCandidato {
  busqueda?: string
  activo?: boolean
}

export const getEvaluadoresCandidatos = async (
  filtros: FiltrosEvaluadorCandidato = {},
): Promise<EvaluadorCandidatoDto[]> => {
  const params = new URLSearchParams()
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda)
  if (filtros.activo !== undefined) params.set('activo', String(filtros.activo))
  const query = params.toString()
  const response = await httpGet<ApiResponse<EvaluadorCandidatoDto[]>>(`${BASE}${query ? `?${query}` : ''}`)
  return response.data ?? []
}

export const crearEvaluadorCandidato = async (request: EvaluadorCandidatoRequest): Promise<EvaluadorCandidatoDto> => {
  const response = await httpPost<ApiResponse<EvaluadorCandidatoDto>>(BASE, request)
  return response.data
}

export const modificarEvaluadorCandidato = async (
  id: number,
  request: EvaluadorCandidatoRequest,
): Promise<EvaluadorCandidatoDto> => {
  const response = await httpPut<ApiResponse<EvaluadorCandidatoDto>>(`${BASE}/${id}`, request)
  return response.data
}

export const desactivarEvaluadorCandidato = async (id: number): Promise<EvaluadorCandidatoDto> => {
  const response = await httpPut<ApiResponse<EvaluadorCandidatoDto>>(`${BASE}/${id}/desactivar`)
  return response.data
}

export const reactivarEvaluadorCandidato = async (id: number): Promise<EvaluadorCandidatoDto> => {
  const response = await httpPut<ApiResponse<EvaluadorCandidatoDto>>(`${BASE}/${id}/reactivar`)
  return response.data
}
