export type EstadoProcesoLiquidacion = 'BORRADOR' | 'ABIERTO' | 'CERRADO' | 'PUBLICADO'
export type EstadoLiquidacion = 'PENDIENTE_RESPUESTA' | 'RESPONDIDA' | 'LIQUIDADA' | 'NO_LIQUIDAR'
export type TipoEstudianteLiquidacion = 'VIGENTE' | 'NUEVO'
export interface ResumenProceso { convocados: number; pendientes: number; respondidas: number; noLiquidar: number; liquidadas: number; conAlertas: number }
export interface ParametrosProceso {
  valorSmmlv: number; fuenteSmmlv: string | null; porcentajeVotacion: number; porcentajeSalud: number
  baseSalud: 'SMMLV' | 'MATRICULA'; fechaLimiteRespuesta: string
}
export interface CrearProcesoRequest extends ParametrosProceso { periodoId: number; procesoBaseId?: number }
export interface ProcesoLiquidacion extends ParametrosProceso {
  id: number; periodoId: number; periodo: string; estado: EstadoProcesoLiquidacion; procesoBaseId?: number | null
  fechaLimitePago?: string | null; fechaEnvioSolicitudes?: string | null; fechaCierre?: string | null; fechaPublicacion?: string | null
  resumen: ResumenProceso
}
export interface RespuestasLiquidacion { entregoTrabajoGrado: boolean | null; cumLaude: boolean | null; certificadoVotacion: boolean | null; deseaSalud: boolean | null }
export type RespuestasRequest = Partial<RespuestasLiquidacion>
export interface RespuestasCoordinacionRequest extends RespuestasRequest { certificadoVotacionRecibido?: boolean; observaciones?: string | null }
export interface AjustesLiquidacionRequest { semestre: number; promocion: number | null; ajusteManual: number; valorFinalManual: number | null; observaciones: string | null }
export interface CalculoLiquidacion {
  factorMatricula: number | null; factorDerechos: number | null; valorMatricula: number | null; valorDerechos: number | null
  descuentoTrabajoGrado: number; descuentoCumLaude: number; descuentoVotacion: number; valorSalud: number; totalCalculado: number | null
}
export interface LiquidacionMatricula {
  id: number; procesoId: number; estudianteId: number; codigoEstudiante: string; nombreCompleto?: string | null
  programaId: number; programa: string; programaCodigo: string; tipoEstudiante: TipoEstudianteLiquidacion
  periodoIngreso?: string | null; permanenciaMaxima?: string | null; cohorte?: number | null; promocion?: number | null
  semestre?: number | null; semestreOrigen?: 'CALCULADO' | 'MANUAL'; estado: EstadoLiquidacion
  respuestas: RespuestasLiquidacion; origenRespuesta?: 'ESTUDIANTE' | 'COORDINADOR' | null; certificadoVotacionRecibido?: boolean
  fechaEnvioSolicitud?: string | null; fechaUltimoRecordatorio?: string | null; fechaRespuesta?: string | null; fechaLiquidada?: string | null
  calculo?: CalculoLiquidacion | null; ajusteManual: number; valorFinalManual?: number | null; totalFinal?: number | null
  observaciones?: string | null; alertas: string[]; motivoExclusion?: string | null; liquidada: boolean
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
export interface Omision { liquidacionId?: number; estudianteId: number; motivo: string }
export interface ResultadoEnvio { enviados: number; omitidos: Omision[] }
export interface ResultadoConvocatoria { creadas: number; yaExistentes: number; omitidos: Omision[] }
export interface ResultadoRecalculo { recalculadas: number; sinCambios: number }
export interface ResultadoAcciones {
  convocar: ResultadoConvocatoria; enviarSolicitudes: ResultadoEnvio; enviarRecordatorio: ResultadoEnvio
  cerrar: ProcesoLiquidacion; reabrir: ProcesoLiquidacion; recalcular: ResultadoRecalculo
}
export interface CuerposAcciones {
  convocar: { incluirVigentes: boolean; incluirNuevos: boolean }
  enviarSolicitudes: { liquidacionIds?: number[] }; enviarRecordatorio: { liquidacionIds?: number[] }
  cerrar: undefined; reabrir: undefined; recalcular: undefined
}
export interface CuerposLiquidacion {
  respuestas: RespuestasCoordinacionRequest; ajustes: AjustesLiquidacionRequest
  excluir: { motivo: string }; reincluir: undefined; liquidada: { liquidada: boolean }
}
export interface FiltrosLiquidaciones { programaId?: number; estado?: EstadoLiquidacion | ''; tipo?: TipoEstudianteLiquidacion | ''; conAlertas?: boolean; texto?: string }
export interface TarifaRequest { semestreDesde: number; semestreHasta: number; factorMatricula: number; factorDerechos: number; activo: boolean }
export interface TarifaMatricula extends TarifaRequest { id: number; programaId: number }
export interface EstudianteBusqueda { id: number; codigoNombre: string }
export interface ProgramaFinanciera { id: number; nombre: string }
export interface PeriodoFinanciera { id: number; anio: number; periodo: number; anioPeriodo: string }
