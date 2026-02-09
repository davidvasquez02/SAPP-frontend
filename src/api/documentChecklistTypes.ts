export interface DocumentoUploadedResponseDto {
  aspiranteCargaDocumento: number
  base64DocumentoContenido: string
  estadoDocumento?: string | null
  fechaCargaDocumento: string
  idDocumento: number
  mimeTypeDocumentoContenido: string
  nombreArchivoDocumento: string
  observacionesDocumento?: string | null
  usuarioCargaDocumento: number | null
  versionDocumento: number
}

export interface DocumentChecklistItemDto {
  idTipoDocumentoTramite: number
  codigoTipoDocumentoTramite: string
  nombreTipoDocumentoTramite: string
  descripcionTipoDocumentoTramite?: string | null
  obligatorioTipoDocumentoTramite: boolean
  tipoTramite: string
  documentoCargado: boolean
  documentoUploadedResponse: DocumentoUploadedResponseDto | null
}
