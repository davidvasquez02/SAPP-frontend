import type { ApiResponse } from '../../../api/types'

export type { ApiResponse }

export interface TipoSolicitudDto {
  id: number
  codigoNombre: string
}

export interface SolicitudAcademicaDto {
  id: number
  estudianteId: number
  estudiante: string
  codigoEstudianteUis: string
  programaAcademico: string
  tipoSolicitudId: number
  tipoSolicitudCodigo: string
  tipoSolicitud: string
  estadoId: number
  estadoSigla: string
  estado: string
  fechaRegistro: string
  fechaResolucion: string | null
  observaciones: string | null
}

export interface CreateSolicitudRequestDto {
  estudianteId: number
  tipoSolicitudId: number
  fechaResolucion: string | null
  observaciones: string
}
