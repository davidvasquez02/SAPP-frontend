export type PeriodoAcademicoDto = {
  id: number
  anio: number
  periodo: 1 | 2
  anioPeriodo: string
  descripcion: string | null
  fechaInicio: string | null
  fechaFin: string | null
}

export type TipoTramiteDto = {
  id: number
  codigo: number
  nombre: string
}

export type FechaTramiteDto = {
  id: number
  descripcion: string
  fechaInicio: string
  fechaFin: string
  periodo: PeriodoAcademicoDto
  tipoTramite: TipoTramiteDto
}

export type PeriodoAcademicoWithFechasDto = {
  periodo: PeriodoAcademicoDto
  fechas: FechaTramiteDto[]
}

export type CreatePeriodoAcademicoRequestDto = {
  anio: number
  periodo: 1 | 2
  fechaInicio: string
  fechaFin: string
  fechas: Array<{
    tipoTramiteId: number
    fechaInicio: string
    fechaFin: string
    descripcion: string
  }>
}

export type UpdatePeriodoAcademicoRequestDto = {
  fechaInicio: string
  fechaFin: string
  descripcion: string
}

export type PeriodoAcademicoFechaRequestDto = {
  periodoId: number
  tipoTramiteId: number
  fechaInicio: string
  fechaFin: string
  descripcion: string
}
