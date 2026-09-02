const FIRMA_STORAGE_PREFIX = 'SAPP_FIRMA_PERFIL'

export interface FirmaPerfil {
  nombreArchivo: string
  mimeType: string
  contenidoBase64: string
}

const storageKey = (usuarioId: number) => `${FIRMA_STORAGE_PREFIX}:${usuarioId}`

export const getFirmaPerfil = (usuarioId: number): FirmaPerfil | null => {
  const storedValue = localStorage.getItem(storageKey(usuarioId))
  if (!storedValue) return null

  try {
    return JSON.parse(storedValue) as FirmaPerfil
  } catch {
    return null
  }
}

export const updateFirmaPerfil = (usuarioId: number, firma: FirmaPerfil): void => {
  localStorage.setItem(storageKey(usuarioId), JSON.stringify(firma))
}
