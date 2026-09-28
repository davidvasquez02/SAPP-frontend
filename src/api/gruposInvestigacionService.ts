import { httpDelete, httpGet, httpPost, httpPut } from '../shared/http/httpClient'
import type { ApiResponse } from './types'
import type {
  DocenteDto,
  GrupoInvestigacionDocenteDto,
  GrupoInvestigacionDto,
  RegistrarDocenteGrupoRequest,
} from './gruposInvestigacionTypes'

export const getDocentes = async (): Promise<DocenteDto[]> => {
  const response = await httpGet<ApiResponse<DocenteDto[]>>('/sapp/docentes')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar los docentes.')
  }

  const docentes = response.data

  if (!Array.isArray(docentes)) {
    throw new Error('El servicio de docentes devolvió una respuesta con formato inválido.')
  }

  return docentes
}

export const asignarRolDocentePosgrados = async (docenteUuid: string): Promise<void> => {
  const response = await httpPost<ApiResponse<unknown> | undefined>(
    `/sapp/docentes/${encodeURIComponent(docenteUuid)}/asignarRolDocentePosgrados`,
  )

  if (response && !response.ok) {
    throw new Error(response.message || 'No fue posible agregar el profesor a posgrados.')
  }
}

export const eliminarRolDocentePosgrados = async (docenteUuid: string): Promise<void> => {
  const response = await httpDelete<ApiResponse<unknown> | undefined>(
    `/sapp/docentes/${encodeURIComponent(docenteUuid)}/rolDocentePosgrados`,
  )

  if (response && !response.ok) {
    throw new Error(response.message || 'No fue posible retirar el profesor de posgrados.')
  }
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

export const asignarDirectorGrupoInvestigacion = async (
  grupoId: number,
  docenteId: number,
): Promise<void> => {
  const qs = new URLSearchParams({ grupoId: String(grupoId), docenteId: String(docenteId) })
  const response = await httpPut<ApiResponse<unknown> | undefined>(
    `/sapp/gruposInvestigacionDocentes/director?${qs.toString()}`,
  )

  if (response && !response.ok) {
    throw new Error(response.message || 'No fue posible asignar el director del grupo.')
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
