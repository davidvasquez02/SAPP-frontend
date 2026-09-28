export type EtapaEvaluacion = 'HOJA_DE_VIDA' | 'EXAMEN_DE_CONOCIMIENTOS' | 'ENTREVISTA'

export interface EvaluacionAdmisionItem {
  id: number
  inscripcionId: number
  etapaEvaluacion: EtapaEvaluacion
  aspecto: string
  codigo: string
  consideraciones: string | null
  evaluador: string | null
  evaluadorId: number | null
  fechaRegistro: string | null
  observaciones: string | null
  ponderacionId: number
  puntajeAspirante: number | null
  puntajeMax: number
}
