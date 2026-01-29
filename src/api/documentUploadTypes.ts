export interface DocumentUploadRequest {
  tipoDocumentoTramiteId: number
  nombreArchivo: string
  tramiteId: number
  usuarioCargaId: number | null
  aspiranteCargaId: number
  contenidoBase64: string
  mimeType: string
  tamanoBytes: number
  checksum: string
}

export interface DocumentUploadResponseDto {
  id: number
  aspiranteCargaId: number
  usuarioCargaId: number | null
  nombreArchivo: string
  mimeType: string
  tamanoBytes: number
  checksum: string
  contenidoBase64: string
  version: number
  estado: string | null
}
