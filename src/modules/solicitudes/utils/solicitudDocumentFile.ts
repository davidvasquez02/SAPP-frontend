import { base64ToBlob } from '../../../shared/files/base64FileUtils'
import { htmlToPdf } from './htmlToPdf'

const isHtmlMimeType = (mimeType: string): boolean => mimeType.toLowerCase().split(';', 1)[0].trim() === 'text/html'

const asPdfFilename = (filename: string): string => {
  const basename = filename.replace(/\.[^.]+$/, '')
  return `${basename || 'documento'}.pdf`
}

const buildViewableDocument = async (
  base64: string,
  mimeType: string,
  filename: string,
): Promise<{ blob: Blob; filename: string }> => {
  const source = base64ToBlob(base64, mimeType)

  if (!isHtmlMimeType(mimeType)) {
    return { blob: source, filename }
  }

  return {
    blob: await htmlToPdf(await source.text()),
    filename: asPdfFilename(filename),
  }
}

export const openSolicitudDocument = async (base64: string, mimeType: string, filename: string): Promise<void> => {
  const document = await buildViewableDocument(base64, mimeType, filename)
  const url = URL.createObjectURL(document.blob)

  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export const downloadSolicitudDocument = async (
  base64: string,
  mimeType: string,
  filename: string,
): Promise<void> => {
  const document = await buildViewableDocument(base64, mimeType, filename)
  const url = URL.createObjectURL(document.blob)
  const link = window.document.createElement('a')

  link.href = url
  link.download = document.filename
  link.rel = 'noopener'
  link.click()

  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export const canPreviewSolicitudDocument = (mimeType: string): boolean => {
  const normalized = mimeType.toLowerCase().split(';', 1)[0].trim()
  return normalized === 'application/pdf' || normalized === 'text/html'
}
