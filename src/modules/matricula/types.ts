export type MatriculaConvocatoria = {
  isOpen: boolean
  periodoLabel: string
  fechaInicio: string
  fechaFin: string
  mensaje?: string
}

export type MateriaDto = {
  id: number
  nombre: string
  codigo: string | null
  nivel: number | null
  programaId?: number
}

export type AsignaturaExternaDto = {
  codigo: string
  nombre: string
  creditos: number
  institucion: string
}

export type MateriaSeleccionada = MateriaDto & {
  addedAt: string
  matriculaAsignaturaId?: number
  estado?: string
  grupo?: string | null
  observaciones?: string | null
  externa?: AsignaturaExternaDto
}

export type DocumentoRequerido = {
  id: number
  nombre: string
  obligatorio: boolean
  estado: 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO'
  fechaRevision: string | null
  observaciones: string | null
  selectedFile?: File | null
  uploadStatus?: 'NOT_SELECTED' | 'READY_TO_UPLOAD' | 'UPLOADING' | 'UPLOADED' | 'ERROR'
  uploadedFileName?: string
  uploadedBase64?: string
  uploadedMimeType?: string
  errorMessage?: string
}

export type MatriculaAsignaturaPayload = {
  asignaturaId?: number
  grupo?: string | null
  externa?: AsignaturaExternaDto
}

export type MatriculaAcademicaCreatePayload = {
  estudianteId: number
  periodoId: number
  asignaturas: MatriculaAsignaturaPayload[]
}

export type MatriculaAsignaturaVigenteDto = {
  id: number
  matriculaId: number
  asignaturaId: number
  asignaturaCodigo: string | null
  asignaturaNombre: string
  asignaturaInstitucion?: string | null
  grupo: string | null
  estado: string
  observaciones: string | null
  esInclusionCancelacion?: boolean
}

export type MatriculaAsignaturaValidacionDecision = 'APROBADA' | 'NO_MATRICULADA'

export type MatriculaAsignaturaValidacionPayload = {
  asignaturaId: number
  estado: MatriculaAsignaturaValidacionDecision
  observaciones: string | null
}

export type MatriculaValidacionAsignaturasRequest = {
  usuarioRevisionId: number
  observaciones: string
  asignaturas: MatriculaAsignaturaValidacionPayload[]
}

export type MatriculaAcademicaVigenteDto = {
  id: number
  estudianteId: number
  periodoId: number
  periodoAcademico: string
  estudianteNombreCompleto?: string
  codigoEstudianteUis?: string | null
  programaAcademico?: string
  estado: string
  documentosCompletos?: boolean | null
  fechaSolicitud: string
  fechaRevision?: string | null
  observaciones: string | null
  usuarioRevisionId?: number | null
  usuarioRevisionUsername?: string | null
  asignaturas: MatriculaAsignaturaVigenteDto[]
}

export type MatriculaAcademicaListadoDto = {
  id: number
  estudianteId: number
  estudianteNombreCompleto: string
  codigoEstudianteUis: string | null
  periodoId: number
  periodoAcademico: string
  programaAcademico: string
  estado: string
  documentosCompletos?: boolean | null
  fechaSolicitud: string
  fechaRevision: string | null
  observaciones: string | null
  usuarioRevisionId: number | null
  usuarioRevisionUsername: string | null
  asignaturas: MatriculaAsignaturaVigenteDto[]
}

export type MatriculaVigenteValidationResult =
  | {
      status: 'EXISTS'
      message: string
      matricula: MatriculaAcademicaVigenteDto
    }
  | {
      status: 'CAN_CREATE'
      message: string
      periodoId: number
    }
  | {
      status: 'NO_ACTIVE_PERIOD'
      message: string
    }
