import type { ApiResponse } from '../../api/types'
import type { SolicitudAcademicaDto, TipoSolicitudDto } from './api/types'

export type { ApiResponse }
export type { TipoSolicitudDto }

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

export interface SolicitudCoordinadorDto extends SolicitudAcademicaDto {}

export interface SolicitudEstudianteRowDto extends SolicitudTableRow {}

export interface SolicitudDocumentoItem {
  id: number
  nombre: string
  obligatorio: boolean
}

export interface SolicitudDocumentoDraft extends SolicitudDocumentoItem {
  file: File | null
  error?: string | null
}
