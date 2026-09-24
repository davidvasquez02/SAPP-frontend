import type { AjustesLiquidacionRequest, CuerposLiquidacion, EstadoProcesoLiquidacion, LiquidacionMatricula, PreguntaLiquidacion, RespuestasRequest, TipoEstudianteLiquidacion } from './types'

export function seleccionarRespuestas(respuestas: RespuestasRequest, tipo: TipoEstudianteLiquidacion, preguntas?: PreguntaLiquidacion[]): RespuestasRequest {
  const claves = tipo === 'NUEVO' ? ['certificadoVotacion', 'deseaSalud'] as const : ['entregoTrabajoGrado', 'cumLaude', 'certificadoVotacion', 'deseaSalud'] as const
  return Object.fromEntries(claves.filter(clave => !preguntas || preguntas.some(p => p.clave === clave && p.aplica)).map(clave => [clave, respuestas[clave] ?? null]))
}
export function puedeEditarFila(proceso: EstadoProcesoLiquidacion, fila: Pick<LiquidacionMatricula, 'estado' | 'totalFinal'>, accion: keyof CuerposLiquidacion): boolean {
  if (proceso === 'PUBLICADO') return false
  if (accion === 'ajustes') return true
  if (accion === 'reincluir') return fila.estado === 'NO_LIQUIDAR'
  if (accion === 'respuestas' || accion === 'excluir') return fila.estado === 'PENDIENTE_RESPUESTA' || fila.estado === 'RESPONDIDA'
  return fila.estado === 'LIQUIDADA' || (fila.estado === 'RESPONDIDA' && fila.totalFinal != null)
}
export const ajustesActuales = (fila: LiquidacionMatricula): AjustesLiquidacionRequest => ({
  semestre: fila.semestre ?? 1, promocion: fila.promocion ?? null, ajusteManual: fila.ajusteManual ?? 0,
  valorFinalManual: fila.valorFinalManual ?? null, observaciones: fila.observaciones ?? null,
})
export const money = (value?: number | null) => value == null ? 'Sin calcular' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 4 }).format(value)
export const fechaColombia = (value?: string | null) => {
  if (!value) return 'Sin registro'
  // Las fechas del servicio son locales de Colombia, sin zona: conservar sus componentes.
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}${match[4] ? ` ${match[4]}` : ''}` : value
}
export const hoyColombia = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
export const ALERTAS: Record<string, string> = {
  SIN_RESPUESTA: 'Sin respuesta: enviar recordatorio o registrar el respaldo.',
  RESPUESTA_FUERA_DE_PLAZO: 'Respuesta fuera del plazo. Aviso informativo.',
  SEMESTRE_NO_CALCULABLE: 'Falta el semestre: ingresarlo en ajustes.',
  PERMANENCIA_AMPLIADA: 'Permanencia ampliada: confirmar el acta que la autoriza.',
  SEMESTRE_FUERA_DE_TARIFA: 'Sin tarifa aplicable: revisar tarifas o fijar un valor final autorizado.',
  VOTACION_SIN_CERTIFICADO: 'Falta certificado de votación o su marca de recepción por correo.',
  ESTUDIANTE_NO_ACTIVO: 'Estudiante no activo: revisar si corresponde liquidarlo.',
  CUENTA_IAM_PENDIENTE: 'Sin cuenta propia: registrar respuestas por coordinación y avisar por otro medio.',
}
