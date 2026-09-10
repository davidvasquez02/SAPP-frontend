export type PeriodoAcademicoDto = {
  id: number
  anioPeriodo: string
  descripcion: string | null
  fechaInicio: string | null
  fechaFin: string | null
  anio: number | null
  periodo: number | null
}

export type PeriodoAcademicoFechaRequest = {
  periodoId: number
  tipoTramiteId: number
  fechaInicio: string
  fechaFin: string
  descripcion: string
}
