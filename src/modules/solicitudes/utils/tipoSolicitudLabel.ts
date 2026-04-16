const removeCodigoPrefix = (value: string): string => value.replace(/^[A-Za-z]*\d+\s*[-–:]\s*/u, '').trim()

export const formatTipoSolicitudLabel = (codigoNombre?: string | null): string => {
  if (typeof codigoNombre !== 'string') {
    return ''
  }

  const normalized = codigoNombre.trim()
  if (!normalized) {
    return ''
  }

  return removeCodigoPrefix(normalized)
}
