export type PeriodoAcademicoDto = {
  id: number
  anio: number
  periodo: 1 | 2
  anioPeriodo: string
  descripcion: string | null
  fechaInicio: string | null
  fechaFin: string | null
}

export type PeriodoAcademicoFechaRequestDto = {
  periodoId: number
  tipoTramiteId: number
  fechaInicio: string
  fechaFin: string
  descripcion: string
}
