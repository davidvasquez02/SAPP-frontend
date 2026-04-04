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
  codigo: string
  nivel: number
}

export type MateriaSeleccionada = MateriaDto & {
  addedAt: string
}

export type DocumentoRequerido = {
  id: number
  nombre: string
  obligatorio: boolean
  estado: 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO'
  fechaRevision: string | null
  observaciones: string | null
}
