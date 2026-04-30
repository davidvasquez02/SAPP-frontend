import type { ApiResponse } from '../../../api/types'

export type { ApiResponse }

export interface TipoSolicitudDto {
  id: number
  codigoNombre: string | null
  tramiteId?: number | null
  tipoTramiteId?: number | null
  nombre?: string | null
}


export interface EstadoSolicitudDto {
  id: number
  nombre: string
  sigla: string
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
  tipoTramiteCodigo?: string | null
  estadoId: number
  estadoSigla: string
  estado: string
  fechaRegistro: string
  fechaResolucion: string | null
  observaciones: string | null
  motivosCreditoCondonable?: string[] | null
}

export interface CreateSolicitudRequestDto {
  estudianteId: number
  tipoSolicitudId: number
  fechaResolucion: string | null
  observaciones: string
  modalidadId?: number
  motivosCreditoCondonable?: string[]
  solicitudHomologacionesAsignaturas?: SolicitudHomologacionAsignaturaRequestDto[]
}

export interface CreateSolicitudResponseDto {
  id: number
  tipoTramiteCodigo?: string | null
}

export interface SolicitudHomologacionAsignaturaRequestDto {
  asignatura_origen_id: number
  asignatura_destino_id: number
}

export interface ModalidadContraprestacionDto {
  id: number
  nombre: string
}

export interface AsignaturaCatalogoDto {
  id: number
  codigo: string | null
  nombre: string
}
