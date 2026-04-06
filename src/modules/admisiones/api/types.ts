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
  posicionAdmision?: number | null
  periodoAcademico: string
  programaAcademico: string
  numeroDocumento?: string | null
  cedula?: string | null
  emailPersonal?: string | null
  correo?: string | null
  telefono?: string | null
  observaciones: string | null
}
