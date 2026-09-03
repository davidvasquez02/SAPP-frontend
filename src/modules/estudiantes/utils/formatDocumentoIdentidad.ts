const DOCUMENTO_PLACEHOLDERS = new Set(['N/A', 'NA'])

const normalizeDocumentPart = (value: string | null | undefined): string => {
  const normalized = value?.trim() ?? ''

  return DOCUMENTO_PLACEHOLDERS.has(normalized.toUpperCase()) ? '' : normalized
}

export const formatDocumentoIdentidad = (
  tipoDocumento: string | null | undefined,
  numeroDocumento: string | null | undefined,
  emptyValue = '—',
): string => {
  const documento = [
    normalizeDocumentPart(tipoDocumento),
    normalizeDocumentPart(numeroDocumento),
  ].filter(Boolean).join(' ')

  return documento || emptyValue
}
