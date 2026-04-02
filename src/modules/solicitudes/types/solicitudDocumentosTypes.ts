export type SolicitudDocumentoRequirement = {
  id: number
  nombre: string
  obligatorio: boolean
}

export type SolicitudDocumentoAdjunto = {
  requirementId: number
  fileName: string
  mimeType: string
  base64: string
  updatedAt: string
}

export type SolicitudDocumentoDraft = {
  requirement: SolicitudDocumentoRequirement
  current: SolicitudDocumentoAdjunto | null
  selectedFile: File | null
  error?: string | null
}
