export type IdiomaEvaluadorCandidato = 'ES' | 'EN'

export interface EvaluadorCandidatoDto {
  id: number
  nombre: string
  tratamiento: string | null
  correo: string
  institucion: string | null
  externo: boolean
  idioma: IdiomaEvaluadorCandidato
  notas: string | null
  activo: boolean
  fechaRegistro: string
}

export interface EvaluadorCandidatoRequest {
  nombre: string
  tratamiento?: string
  correo: string
  institucion?: string
  externo: boolean
  idioma: IdiomaEvaluadorCandidato
  notas?: string
}
