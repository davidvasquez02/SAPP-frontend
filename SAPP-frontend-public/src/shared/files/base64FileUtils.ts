const DATA_PREFIX_REGEX = /^data:.*;base64,/i

export const normalizeBase64 = (input: string): string =>
  input.replace(DATA_PREFIX_REGEX, '').replace(/\s+/g, '').trim()

export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const normalized = normalizeBase64(base64)
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

export const openBase64InNewTab = (base64: string, mimeType: string, filename?: string): void => {
  const blob = base64ToBlob(base64, mimeType)
  const url = URL.createObjectURL(blob)

  void filename
  window.open(url, '_blank', 'noopener,noreferrer')

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export const downloadBase64File = (base64: string, mimeType: string, filename: string): void => {
  const blob = base64ToBlob(base64, mimeType)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.click()

  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
