export interface ApiResponse<T> {
  ok: boolean
  message: string
  data: T
}

export interface InscripcionAdmisionDto {
  id: number
  aspiranteId: number
  nombreAspirante: string
  estado: string
  fechaInscripcion: string
  fechaResultado: string | null
  puntajeTotal: number | null
  posicion_admision: number | null
  periodoAcademico: string
  programaAcademico: string
  observaciones: string | null
}
