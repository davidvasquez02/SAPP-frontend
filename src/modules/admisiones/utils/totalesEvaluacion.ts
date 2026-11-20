import type { EvaluacionAdmisionItem } from '../types/evaluacionAdmisionTypes'

/**
 * Aspectos que son TOTALES: los calcula el sistema y no se ingresan por teclado. HV es el total de la hoja de vida,
 * ENTREV_MIEM_COMIT el total de cada evaluador en la entrevista y ENTREV el promedio de los totales de los evaluadores.
 */
export const CODIGOS_TOTAL_CALCULADO: ReadonlySet<string> = new Set(['HV', 'ENTREV', 'ENTREV_MIEM_COMIT'])

export const esTotalCalculado = (item: Pick<EvaluacionAdmisionItem, 'codigo'>): boolean =>
  CODIGOS_TOTAL_CALCULADO.has(item.codigo.trim())

type Borrador = { puntajeAspirante?: number }

const redondear = (valor: number): number => Math.round(valor * 100) / 100

/**
 * Suma de los aspectos de un grupo (sin contar su fila de total). Usa lo que se está digitando si hay un borrador y lo
 * guardado si no, de modo que el total se actualiza mientras se escribe y coincide con el que calcula el backend al guardar.
 */
export const sumarAspectos = (
  items: EvaluacionAdmisionItem[],
  drafts: Record<number, Borrador | undefined>,
): number =>
  redondear(
    items
      .filter((item) => !esTotalCalculado(item))
      .reduce((total, item) => {
        const draft = drafts[item.id]
        const tieneBorrador = draft != null && Object.prototype.hasOwnProperty.call(draft, 'puntajeAspirante')
        const valor = tieneBorrador ? draft.puntajeAspirante : item.puntajeAspirante
        return total + (typeof valor === 'number' && Number.isFinite(valor) ? valor : 0)
      }, 0),
  )

/** Promedio de los totales de cada evaluador; sin evaluadores es 0. */
export const promediarTotales = (totales: number[]): number =>
  totales.length === 0 ? 0 : redondear(totales.reduce((suma, total) => suma + total, 0) / totales.length)
