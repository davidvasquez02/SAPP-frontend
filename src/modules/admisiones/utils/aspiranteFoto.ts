import type { DocumentoFotoDto } from '../api/types'

export const getAspiranteFotoSrc = (foto?: DocumentoFotoDto | null): string | null => {
  const contenidoBase64 = foto?.contenidoBase64?.trim()
  if (!contenidoBase64) {
    return null
  }

  if (contenidoBase64.startsWith('data:')) {
    return contenidoBase64
  }

  const mimeType = foto?.mimeType?.trim() || 'image/jpeg'
  return `data:${mimeType};base64,${contenidoBase64}`
}
