export const formatTipoSolicitudLabel = (codigoNombre: string): string => {
  const normalized = codigoNombre.trim()
  if (!normalized) {
    return ''
  }

  return normalized.replace(/^[A-Za-z]*\d+\s*[-–:]\s*/u, '').trim()
}
