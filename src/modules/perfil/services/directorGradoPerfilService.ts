import type { ApiResponse } from '../../../api/types'
import { httpGet, httpPut } from '../../../shared/http/httpClient'
import type { GrupoInvestigacionDocenteDto } from '../../../api/gruposInvestigacionTypes'

export interface DirectorGradoPerfil {
  estudianteId: number
  puedeAsignar: boolean
  grupo: { id: number; nombre: string } | null
  director: { id: number; nombreCompleto: string | null; correo: string | null } | null
}

export interface AsignarDirectorGradoRequest {
  grupoInvestigacionId: number
  directorId: number
}

const unwrap = (response: ApiResponse<DirectorGradoPerfil>): DirectorGradoPerfil => {
  if (!response.ok || !response.data) {
    throw new Error(response.message || 'No fue posible consultar la asignación del director de grado.')
  }
  return response.data
}

export const obtenerDirectorGradoPerfil = async (estudianteId: number): Promise<DirectorGradoPerfil> =>
  unwrap(await httpGet<ApiResponse<DirectorGradoPerfil>>(`/sapp/estudiantes/${estudianteId}/director-grado`))

export const asignarDirectorGradoPerfil = async (
  estudianteId: number,
  request: AsignarDirectorGradoRequest,
): Promise<DirectorGradoPerfil> =>
  unwrap(await httpPut<ApiResponse<DirectorGradoPerfil>>(`/sapp/estudiantes/${estudianteId}/director-grado`, request))

export const obtenerDocentesPosgradosGrupo = async (grupoId: number): Promise<GrupoInvestigacionDocenteDto[]> => {
  const response = await httpGet<ApiResponse<GrupoInvestigacionDocenteDto[]>>(
    `/sapp/gruposInvestigacionDocentes?grupoId=${grupoId}&soloPosgrados=true`,
  )
  if (!response.ok) throw new Error(response.message || 'No fue posible consultar los docentes del grupo.')
  return response.data ?? []
}
