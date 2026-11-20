import type { ApiResponse } from '../../../api/types'

export type ConvocatoriaAdmisionDto = {
  id: number
  programaId: number
  programa: string
  periodoId: number
  periodo: string
  cupos: number
  fechaInicio: string
  fechaFin: string
  observaciones: string | null
  vigente: boolean
  /** false cuando la evaluación ya se inició para algún aspirante: la convocatoria y sus evaluadores dejan de poder editarse. */
  editable?: boolean
}

export type CreateConvocatoriaRequest = {
  cupos: number
  fechaInicio: string
  fechaFin: string
  observaciones: string
  programaId: number
  periodoId: number
}

export type UpdateConvocatoriaRequest = {
  fechaInicio?: string
  fechaFin?: string
  cupos?: number
  observaciones?: string
}

export type UpdateConvocatoriaFechasRequest = {
  fechaInicio?: string
  fechaFin?: string
}

export type EvaluadorConvocatoriaDto = {
  convocatoriaId: number
  evaluador: string
  evaluadorId: number
  id: number
  programa: string
  /** Miembro fijo del comité por su cargo (coordinador o director de escuela): no se puede quitar. */
  fijo?: boolean
}

export type DocenteEvaluadorOption = {
  uuid: string
  nombre: string
}

export type ConvocatoriaAdmisionListResponse = ApiResponse<ConvocatoriaAdmisionDto[]>
export type ConvocatoriaAdmisionCreateResponse = ApiResponse<ConvocatoriaAdmisionDto | null>
export type ConvocatoriaAdmisionCloseResponse = ApiResponse<null>
export type ConvocatoriaAdmisionDatesUpdateResponse = ApiResponse<ConvocatoriaAdmisionDto | null>
export type EvaluadoresConvocatoriaResponse = ApiResponse<EvaluadorConvocatoriaDto[]>
