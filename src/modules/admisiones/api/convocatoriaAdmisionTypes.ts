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
}

export type CreateConvocatoriaRequest = {
  cupos: number
  fechaInicio: string
  fechaFin: string
  observaciones: string
  programaId: number
  periodoId: number
}

export type ConvocatoriaAdmisionListResponse = ApiResponse<ConvocatoriaAdmisionDto[]>
export type ConvocatoriaAdmisionCreateResponse = ApiResponse<ConvocatoriaAdmisionDto | null>
export type ConvocatoriaAdmisionCloseResponse = ApiResponse<null>
