import type { EvaluacionJurado, JuradoEvaluador } from './types'

export interface ValorEvaluacionPresentado {
  etiqueta: 'Concepto' | 'Resultado' | 'Nota' | 'Evaluación'
  valor: string | number | null | undefined
}

export const presentarValorEvaluacion = (
  evaluacion: EvaluacionJurado,
  tipoSolicitudCodigo: string,
): ValorEvaluacionPresentado => {
  const momentoCodigo = evaluacion.momentoCodigo?.trim().toLocaleUpperCase('es-CO')

  if (momentoCodigo === 'CONCEPTO_DOCUMENTO') {
    return {
      etiqueta: 'Concepto',
      valor: evaluacion.conceptoNombre || evaluacion.concepto || evaluacion.conceptoCodigo,
    }
  }

  if (momentoCodigo === 'SUSTENTACION') {
    if (tipoSolicitudCodigo.trim().toLocaleUpperCase('es-CO') === 'CAND_DOCTORAL') {
      return { etiqueta: 'Nota', valor: evaluacion.nota }
    }

    return {
      etiqueta: 'Resultado',
      valor: evaluacion.resultadoNombre || evaluacion.resultado || evaluacion.resultadoCodigo,
    }
  }

  return {
    etiqueta: 'Evaluación',
    valor: evaluacion.conceptoNombre || evaluacion.concepto || evaluacion.resultadoNombre ||
      evaluacion.resultado || evaluacion.nota,
  }
}

export const presentarNotaFinalCandidatura = (
  notaFinal: number | null | undefined,
  tipoSolicitudCodigo: string | null | undefined,
): string | null => {
  if (
    tipoSolicitudCodigo?.trim().toLocaleUpperCase('es-CO') !== 'CAND_DOCTORAL' ||
    notaFinal == null ||
    !Number.isFinite(notaFinal)
  ) {
    return null
  }

  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(notaFinal)
}

export const ETIQUETA_TRAS_CORRECCIONES = 'Tras las correcciones'

export const rondaDeEvaluacion = (evaluacion: EvaluacionJurado): number => evaluacion.ronda ?? 1

export const esConceptoDelDocumento = (evaluacion: EvaluacionJurado): boolean =>
  evaluacion.momentoCodigo?.trim().toLocaleUpperCase('es-CO') === 'CONCEPTO_DOCUMENTO'

/** Etiqueta que distingue el concepto emitido tras revisar las correcciones del concepto original. */
export const etiquetaRondaEvaluacion = (evaluacion: EvaluacionJurado): string | null =>
  esConceptoDelDocumento(evaluacion) && rondaDeEvaluacion(evaluacion) > 1 ? ETIQUETA_TRAS_CORRECCIONES : null

/** Evaluaciones del jurado en el orden en que se emitieron: ronda y luego fecha de registro. */
export const evaluacionesOrdenadas = (jurado: JuradoEvaluador): EvaluacionJurado[] =>
  [...(jurado.evaluaciones ?? [])].sort((first, second) =>
    rondaDeEvaluacion(first) - rondaDeEvaluacion(second)
    || (first.fechaRegistro ?? '').localeCompare(second.fechaRegistro ?? ''))

/** Cuantos jurados activos que aceptaron ya emitieron su concepto de la ronda vigente, y cuantos deben hacerlo. */
export const progresoConceptosDeLaRonda = (
  jurados: JuradoEvaluador[],
  ronda: number,
): { emitidos: number, total: number } => {
  const evaluadores = jurados.filter((jurado) => jurado.activo)
  const emitidos = evaluadores.filter((jurado) => (jurado.evaluaciones ?? []).some(
    (evaluacion) => esConceptoDelDocumento(evaluacion) && rondaDeEvaluacion(evaluacion) === ronda,
  )).length
  return { emitidos, total: evaluadores.length }
}
