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
  nivel: number
  programaId?: number
}

export type MateriaSeleccionada = MateriaDto & {
  addedAt: string
  grupo: string
}

export type DocumentoRequerido = {
  id: number
  nombre: string
  obligatorio: boolean
  estado: 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO'
  fechaRevision: string | null
  observaciones: string | null
}

export type MatriculaAsignaturaPayload = {
  asignaturaId: number
  grupo: string
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
  grupo: string
  estado: string
  observaciones: string | null
}

export type MatriculaAcademicaVigenteDto = {
  id: number
  estudianteId: number
  periodoId: number
  periodoAcademico: string
  estado: string
  fechaSolicitud: string
  observaciones: string | null
  asignaturas: MatriculaAsignaturaVigenteDto[]
}
