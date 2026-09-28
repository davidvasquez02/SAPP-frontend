const DUPLICATE_CONVOCATORIA_CONSTRAINT = 'uq_convocatoria'

const getErrorMessage = (error: unknown): string | null =>
  error instanceof Error && error.message.trim() ? error.message.trim() : null

export const isDuplicateConvocatoriaError = (error: unknown): boolean => {
  const message = getErrorMessage(error)?.toLocaleLowerCase('es')

  if (!message) return false

  return message.includes(DUPLICATE_CONVOCATORIA_CONSTRAINT)
    || (message.includes('duplicate key')
      && message.includes('programa_id')
      && message.includes('periodo_id'))
}

export const getConvocatoriaCreateErrorMessage = (
  error: unknown,
  periodoLabel: string,
): string => {
  if (isDuplicateConvocatoriaError(error)) {
    return `Ya existe una convocatoria para el programa seleccionado en el período académico ${periodoLabel}.`
  }

  return getErrorMessage(error)
    ?? 'No fue posible crear la convocatoria. Inténtelo nuevamente.'
}
