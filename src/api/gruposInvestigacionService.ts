import { httpDelete, httpGet, httpPost } from '../shared/http/httpClient'
import type { ApiResponse } from './types'
import type {
  DocenteDto,
  DocentesPageDto,
  GrupoInvestigacionDocenteDto,
  GrupoInvestigacionDto,
  RegistrarDocenteGrupoRequest,
} from './gruposInvestigacionTypes'

export const getDocentes = async (): Promise<DocenteDto[]> => {
  const response = await httpGet<ApiResponse<DocentesPageDto>>('/sapp/docentes')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar los docentes.')
  }

  const docentes = response.data?.data

  if (!Array.isArray(docentes)) {
    throw new Error('El servicio de docentes devolvió una respuesta con formato inválido.')
  }

  return docentes
}

export const getGruposInvestigacion = async (): Promise<GrupoInvestigacionDto[]> => {
  const response = await httpGet<ApiResponse<GrupoInvestigacionDto[]>>('/sapp/gruposInvestigacion')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar los grupos de investigación.')
  }

  return response.data ?? []
}

export const getDocentesGrupoInvestigacion = async (
  grupoId: number,
): Promise<GrupoInvestigacionDocenteDto[]> => {
  const qs = new URLSearchParams({ grupoId: String(grupoId) })
  const response = await httpGet<ApiResponse<GrupoInvestigacionDocenteDto[]>>(
    `/sapp/gruposInvestigacionDocentes?${qs.toString()}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar los docentes del grupo.')
  }

  return response.data ?? []
}

export const registrarDocenteGrupoInvestigacion = async (
  payload: RegistrarDocenteGrupoRequest,
): Promise<void> => {
  const response = await httpPost<ApiResponse<unknown>>('/sapp/gruposInvestigacionDocentes', payload)

  if (response && !response.ok) {
    throw new Error(response.message || 'No fue posible registrar el docente en el grupo.')
  }
}

export const eliminarDocenteGrupoInvestigacion = async (
  grupoId: number,
  docenteId: number,
): Promise<void> => {
  const qs = new URLSearchParams({ grupoId: String(grupoId), docenteId: String(docenteId) })
  const response = await httpDelete<ApiResponse<unknown>>(
    `/sapp/gruposInvestigacionDocentes?${qs.toString()}`,
  )

  if (response && !response.ok) {
    throw new Error(response.message || 'No fue posible retirar el docente del grupo.')
  }
}
