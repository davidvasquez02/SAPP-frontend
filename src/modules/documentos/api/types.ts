export type { ApiResponse } from '../../../api/types'

export interface DocumentoUploadedResponseDto {
  idDocumento: number
  nombreArchivoDocumento: string
  versionDocumento: number
  fechaCargaDocumento: string
  estadoDocumento?: string | null
  observacionesDocumento?: string | null
  mimeTypeDocumentoContenido?: string
  base64DocumentoContenido?: string
  mimeType?: string
  contenidoBase64?: string
  aspiranteCargaDocumento?: number
  usuarioCargaDocumento?: number | null
}

export interface DocumentoTramiteItemDto {
  codigoTipoDocumentoTramite: string
  descripcionTipoDocumentoTramite: string
  documentoCargado: boolean
  documentoUploadedResponse: DocumentoUploadedResponseDto | null
  idTipoDocumentoTramite: number
  nombreTipoDocumentoTramite: string
  obligatorioTipoDocumentoTramite: boolean
  tipoTramite: string
}
