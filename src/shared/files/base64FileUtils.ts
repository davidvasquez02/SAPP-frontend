const DATA_PREFIX_REGEX = /^data:.*;base64,/i

export const normalizeBase64 = (input: string): string =>
  input.replace(DATA_PREFIX_REGEX, '').replace(/\s+/g, '').trim()

export const imageDataUrl = (
  content: string | null | undefined,
  mimeType = 'image/jpeg',
): string | null => {
  const trimmedContent = content?.trim()

  if (!trimmedContent) return null
  if (/^data:image\//i.test(trimmedContent)) return trimmedContent.replace(/\s+/g, '')

  return `data:${mimeType || 'image/jpeg'};base64,${normalizeBase64(trimmedContent)}`
}

export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const normalized = normalizeBase64(base64)
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

export const openBase64InNewTab = (
  base64: string,
  mimeType: string,
  filename?: string,
  targetWindow?: Window | null,
): void => {
  const blob = base64ToBlob(base64, mimeType)
  openBlobInNewTab(blob, filename, targetWindow)
}

export const downloadBase64File = (base64: string, mimeType: string, filename: string): void => {
  const blob = base64ToBlob(base64, mimeType)
  downloadBlobFile(blob, filename)
}

export const openBlobInNewTab = (
  blob: Blob,
  filename?: string,
  targetWindow?: Window | null,
): void => {
  const url = URL.createObjectURL(blob)

  void filename
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = url
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export const downloadBlobFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.click()

  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
