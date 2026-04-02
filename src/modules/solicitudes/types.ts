import type { ApiResponse } from '../../api/types'

export type { ApiResponse }

export interface TipoSolicitudDto {
  id: number
  codigoNombre: string
}

export type SolicitudTableRow = {
  id: number
  tipoSolicitudCodigo: string
  tipoSolicitud: string
  estadoSigla: string
  estado: string
  fechaRegistro: string
  fechaResolucion: string | null
  observaciones: string | null
  programaAcademico: string
  estudiante?: string
  codigoEstudianteUis?: string
}

export interface SolicitudCoordinadorDto extends SolicitudTableRow {
  tipoSolicitudId: number
  estadoId: number
  estudianteId: number
  estudiante: string
  codigoEstudianteUis: string
}

export interface SolicitudEstudianteRowDto extends SolicitudTableRow {
  codigoEstudianteUis?: string
}

export interface SolicitudDocumentoItem {
  id: number
  nombre: string
  obligatorio: boolean
}

export interface SolicitudDocumentoDraft extends SolicitudDocumentoItem {
  file: File | null
  error?: string | null
}
