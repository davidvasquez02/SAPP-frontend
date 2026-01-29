export interface DocumentChecklistItemDto {
  idTipoDocumentoTramite: number
  codigoTipoDocumentoTramite: string
  nombreTipoDocumentoTramite: string
  descripcionTipoDocumentoTramite?: string | null
  obligatorioTipoDocumentoTramite: boolean
  tipoTramite: string
  documentoCargado: boolean
  documentoUploadedResponse: unknown | null
}
