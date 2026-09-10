export type ConvocatoriaApiDto = {
  id: number
  programaId: number
  programa: string
  periodoId: number
  periodo: string
  vigente: boolean
  cupos: number
  fechaInicio: string
  fechaFin: string
  observaciones: string | null
}

export type InscripcionApiDto = {
  id: number
  aspiranteId: number
  nombreAspirante: string
  estado: string
  fechaInscripcion: string
  fechaResultado: string | null
  observaciones: string | null
  periodoAcademico: string
  programaAcademico: string
  puntajeTotal: number | null
  posicionAdmision: number | null
  emailPersonal?: string | null
  numeroDocumento?: string | null
  telefono?: string | null
}
