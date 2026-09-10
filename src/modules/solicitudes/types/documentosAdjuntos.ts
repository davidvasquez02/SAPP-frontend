export interface SolicitudDocumentoAdjuntoDto {
  idDocumento: number
  nombreArchivo: string
  mimeType: string
  base64Contenido: string
  descripcion?: string | null
  obligatorio?: boolean
}
