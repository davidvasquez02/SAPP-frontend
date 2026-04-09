export interface ProgramaCoordinacion {
  id: number
  codigo: string
  nombre: string
}

export interface EstudianteCoordinacion {
  id: number
  codigo: string
  nombreCompleto: string
  tipoDocumento: string
  numeroDocumento: string
  correoInstitucional: string
  estadoAcademico: 'ACTIVO' | 'EN_TRABAJO_DE_GRADO' | 'EN_ESPERA_CANDIDATURA'
  cohorte: string
  promedioAcumulado: number
  creditosAprobados: number
  creditosPendientes: number
  programaId: number
  programaNombre: string
  fechaIngreso: string
}
