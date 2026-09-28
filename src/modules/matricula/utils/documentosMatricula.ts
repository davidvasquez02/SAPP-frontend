import type { DocumentoTramiteItemDto } from '../../documentos/api/types'

const ESTADOS_REVISION_FINAL = new Set(['APROBADO', 'RECHAZADO'])

const getDocumentosObligatorios = (documentos: DocumentoTramiteItemDto[]) =>
  documentos.filter((documento) => documento.obligatorioTipoDocumentoTramite)

const documentoFueCargado = (documento: DocumentoTramiteItemDto) =>
  documento.documentoCargado && documento.documentoUploadedResponse !== null

export const tieneDocumentosObligatoriosCargados = (
  documentos: DocumentoTramiteItemDto[],
) => {
  const obligatorios = getDocumentosObligatorios(documentos)

  return obligatorios.length > 0 && obligatorios.every(documentoFueCargado)
}

export const tieneDocumentosObligatoriosRevisados = (
  documentos: DocumentoTramiteItemDto[],
) => {
  const obligatorios = getDocumentosObligatorios(documentos)

  return (
    obligatorios.length > 0 &&
    obligatorios.every((documento) => {
      if (!documentoFueCargado(documento)) {
        return false
      }

      const estado = documento.documentoUploadedResponse?.estadoDocumento?.trim().toUpperCase()
      return Boolean(estado && ESTADOS_REVISION_FINAL.has(estado))
    })
  )
}
