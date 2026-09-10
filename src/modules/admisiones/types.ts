export type PeriodoAcademico = { anio: number; periodo: 1 | 2 }

export interface Convocatoria {
  id: number
  programaId: number
  programaNivel: 'MAESTRIA' | 'DOCTORADO'
  programaNombre: string
  periodo: PeriodoAcademico
  fechaInicio: string
  fechaFin: string
  estado: 'ABIERTA' | 'CERRADA'
  cupos?: number
}

export const formatoPeriodo = (periodo: PeriodoAcademico): string => {
  return `${periodo.anio}-${periodo.periodo}`
}
