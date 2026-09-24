export type EstadoProcesoLiquidacion = 'BORRADOR' | 'ABIERTO' | 'CERRADO' | 'PUBLICADO'
export type EstadoLiquidacion = 'PENDIENTE_RESPUESTA' | 'RESPONDIDA' | 'LIQUIDADA' | 'NO_LIQUIDAR'
export type TipoEstudianteLiquidacion = 'VIGENTE' | 'NUEVO'

export interface ResumenProceso { convocados: number; pendientes: number; respondidas: number; noLiquidar: number; liquidadas: number; conAlertas: number }
export interface ProcesoLiquidacion {
  id: number; periodoId: number; periodo: string; estado: EstadoProcesoLiquidacion
  valorSmmlv: number; fuenteSmmlv?: string | null; porcentajeVotacion: number; porcentajeSalud: number
  baseSalud: 'SMMLV' | 'MATRICULA'; fechaLimiteRespuesta: string; fechaLimitePago?: string | null
  fechaEnvioSolicitudes?: string | null; fechaCierre?: string | null; fechaPublicacion?: string | null
  resumen: ResumenProceso
}
export interface RespuestasLiquidacion { entregoTrabajoGrado: boolean | null; cumLaude: boolean | null; certificadoVotacion: boolean | null; deseaSalud: boolean | null }
export interface CalculoLiquidacion { factorMatricula: number; factorDerechos: number; valorMatricula: number; valorDerechos: number; descuentoTrabajoGrado: number; descuentoCumLaude: number; descuentoVotacion: number; valorSalud: number; totalCalculado: number }
export interface LiquidacionMatricula {
  id: number; procesoId: number; estudianteId: number; codigoEstudiante: string; nombreCompleto?: string | null
  programaId: number; programa: string; programaCodigo: string; tipoEstudiante: TipoEstudianteLiquidacion
  periodoIngreso?: string | null; promocion?: number | null; semestre?: number | null; estado: EstadoLiquidacion
  respuestas: RespuestasLiquidacion; calculo?: CalculoLiquidacion | null; ajusteManual: number; valorFinalManual?: number | null
  totalFinal?: number | null; alertas: string[]; motivoExclusion?: string | null; liquidada: boolean
}
export interface PreguntaLiquidacion { clave: keyof RespuestasLiquidacion; aplica: boolean; texto: string }
export interface MiLiquidacion {
  liquidacionId: number; proceso: Pick<ProcesoLiquidacion, 'id' | 'periodo' | 'estado' | 'fechaLimiteRespuesta'>
  programa: string; codigoEstudiante: string; tipoEstudiante: TipoEstudianteLiquidacion; estado: EstadoLiquidacion
  puedeResponder: boolean; fueraDePlazo: boolean; preguntas: PreguntaLiquidacion[]; respuestas: RespuestasLiquidacion
  certificado: { requerido: boolean; cargado: boolean }
  valores: null | { totalFinal: number; desglose: null | { matricula: number; derechosAcademicos: number; descuentos: number; salud: number } }
}
export interface StandardResponse<T> { ok: boolean; message: string; data: T }
export interface ResultadoEnvio { enviados: number; omitidos: Array<{ liquidacionId: number; estudianteId: number; motivo: string }> }
export interface FiltrosLiquidaciones { programaId?: number; estado?: EstadoLiquidacion | ''; tipo?: TipoEstudianteLiquidacion | ''; conAlertas?: boolean; texto?: string }
