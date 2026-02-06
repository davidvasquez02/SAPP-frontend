export interface ConvocatoriaAdmisionDto {
  id: number
  programaId: number
  programa: string
  periodoId: number
  periodo: string
  vigente: boolean
  cupos: number | null
  fechaInicio: string
  fechaFin: string
  observaciones: string | null
}
