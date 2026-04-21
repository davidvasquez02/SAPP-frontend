import type { ApiResponse } from '../../../api/types'
import { httpGet } from '../../../shared/http/httpClient'

export type MatriculaCoordinacionEstado =
  | 'RADICADA'
  | 'EN_REVISION'
  | 'FINALIZADA'
  | 'PENDIENTE_DOCUMENTOS'
  | string

export type MatriculaCoordinacionAsignatura = {
  id: number
  matriculaId: number
  asignaturaId: number
  asignaturaCodigo: string | null
  asignaturaNombre: string
  grupo: string
  estado: string
  observaciones: string | null
}

export type MatriculaCoordinacionItem = {
  id: number
  estudianteId: number
  codigoEstudianteUis: string
  estudianteNombreCompleto: string
  programaAcademico: string
  periodoId: number
  periodoAcademico: string
  estado: MatriculaCoordinacionEstado
  fechaSolicitud: string
  fechaRevision: string | null
  observaciones: string | null
  usuarioRevisionId: number | null
  usuarioRevisionUsername: string | null
  asignaturas: MatriculaCoordinacionAsignatura[]
}

export type MatriculaCoordinacionFilters = {
  periodoId?: number
  programaId?: number
  estado?: string
  matriculaId?: number
}

const MATRUCULAS_ENDPOINT = '/sapp/matriculaAcademica'

const toSearchParams = (filters: MatriculaCoordinacionFilters) => {
  const searchParams = new URLSearchParams()

  if (filters.periodoId) {
    searchParams.set('periodoId', String(filters.periodoId))
  }

  if (filters.programaId) {
    searchParams.set('programaId', String(filters.programaId))
  }

  if (filters.estado) {
    searchParams.set('estado', filters.estado)
  }

  if (filters.matriculaId) {
    searchParams.set('matriculaId', String(filters.matriculaId))
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const getMatriculasCoordinacion = async (
  filters: MatriculaCoordinacionFilters
): Promise<MatriculaCoordinacionItem[]> => {
  const response = await httpGet<ApiResponse<MatriculaCoordinacionItem[]>>(
    `${MATRUCULAS_ENDPOINT}${toSearchParams(filters)}`
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar las matrículas académicas.')
  }

  return response.data ?? []
}
