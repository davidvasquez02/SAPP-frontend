import type { EvaluacionJurado } from './types'

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
