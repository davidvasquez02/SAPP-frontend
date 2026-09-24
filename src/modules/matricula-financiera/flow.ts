import type { EstadoProcesoLiquidacion } from './types'

export type AccionProceso = 'convocar' | 'enviarSolicitudes' | 'enviarRecordatorio' | 'cerrar' | 'reabrir' | 'recalcular' | 'publicar'
export interface PasoGuiaLiquidacion { titulo: string; descripcion: string }

export const GUIA_COORDINACION: PasoGuiaLiquidacion[] = [
  { titulo: 'Configura el periodo', descripcion: 'Crea el proceso con el SMMLV, los porcentajes reglamentarios y las fechas del periodo.' },
  { titulo: 'Convoca y solicita', descripcion: 'Incorpora a los estudiantes, envía las preguntas y supervisa respuestas, pendientes y alertas.' },
  { titulo: 'Revisa y liquida', descripcion: 'Valida cada caso, aplica los ajustes autorizados y recalcula antes de cerrar el proceso.' },
  { titulo: 'Publica resultados', descripcion: 'Registra la liquidación realizada en PUTTY, define la fecha de pago y publica para notificar y cerrar las ediciones.' },
]

export const GUIA_ESTUDIANTE: PasoGuiaLiquidacion[] = [
  { titulo: 'Revisa la solicitud', descripcion: 'Confirma el periodo, el programa y la fecha límite indicada por la coordinación.' },
  { titulo: 'Responde la información', descripcion: 'Contesta todas las preguntas que apliquen a tu caso y guarda las respuestas dentro del plazo.' },
  { titulo: 'Espera la revisión', descripcion: 'La coordinación valida la información y realiza la liquidación. Atiende cualquier novedad institucional.' },
  { titulo: 'Consulta el resultado', descripcion: 'Cuando coordinación confirme tu liquidación, podrás consultar el total liquidado para continuar con el pago.' },
]

const ACCIONES_POR_ESTADO: Record<EstadoProcesoLiquidacion, readonly AccionProceso[]> = {
  BORRADOR: ['convocar', 'enviarSolicitudes', 'recalcular'],
  ABIERTO: ['convocar', 'enviarSolicitudes', 'enviarRecordatorio', 'cerrar', 'recalcular'],
  CERRADO: ['reabrir', 'recalcular', 'publicar'],
  PUBLICADO: [],
}

export const puedeEjecutarAccion = (estado: EstadoProcesoLiquidacion | undefined, accion: AccionProceso): boolean =>
  estado ? ACCIONES_POR_ESTADO[estado].includes(accion) : false

export const etiquetaResumen = (clave: string): string => ({ convocados: 'Convocados', pendientes: 'Pendientes', respondidas: 'Respondidas', noLiquidar: 'No liquidar', liquidadas: 'Liquidadas', conAlertas: 'Con alertas' })[clave] ?? clave
