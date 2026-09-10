import { httpGet } from '../shared/http/httpClient'
import type { ApiResponse } from './types'
import type { GrupoInvestigacionDocenteDto, GrupoInvestigacionDto } from './gruposInvestigacionTypes'

export const getGruposInvestigacion = async (): Promise<GrupoInvestigacionDto[]> => {
  const response = await httpGet<ApiResponse<GrupoInvestigacionDto[]>>('/sapp/gruposInvestigacion')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar los grupos de investigación.')
  }

  return response.data ?? []
}

export const getDocentesGrupoInvestigacion = async (
  grupoId: number,
  query = '',
): Promise<GrupoInvestigacionDocenteDto[]> => {
  const qs = new URLSearchParams({
    grupoId: String(grupoId),
    query,
  })
  const response = await httpGet<ApiResponse<GrupoInvestigacionDocenteDto[]>>(
    `/sapp/gruposInvestigacionDocentes?${qs.toString()}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar los docentes del grupo.')
  }

  return response.data ?? []
}
