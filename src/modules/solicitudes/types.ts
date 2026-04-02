import type { ApiResponse } from '../../api/types'

export type { ApiResponse }

export interface TipoSolicitudDto {
  id: number
  codigoNombre: string
}

export interface SolicitudCoordinadorDto {
  id: number
  tipoSolicitudId: number
  tipoSolicitudCodigo: string
  tipoSolicitud: string
  estadoId: number
  estadoSigla: string
  estado: string
  estudianteId: number
  estudiante: string
  codigoEstudianteUis: string
  programaAcademico: string
  fechaRegistro: string
  fechaResolucion: string | null
  observaciones: string | null
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
