export type EstadoValidacionDocumento = 'CORRECTO' | 'INCORRECTO'

export interface GuardarValidacionDocumentoPayloadItem {
  tipoDocumentoTramiteId: number
  estado: EstadoValidacionDocumento
}

export interface GuardarValidacionDocumentosPayload {
  tramiteId: number
  validaciones: GuardarValidacionDocumentoPayloadItem[]
}

export const guardarValidacionDocumentos = async (
  _payload: GuardarValidacionDocumentosPayload,
): Promise<void> => {
  throw new Error('TODO: Endpoint pendiente')
}
