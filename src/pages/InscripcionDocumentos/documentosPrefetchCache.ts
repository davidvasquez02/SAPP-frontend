import { getDocumentosByTramite } from '../../modules/documentos/api/documentosService'
import type { DocumentoTramiteUiItem, DocumentoValidacionEstado } from '../../modules/documentos/types/ui'
import type { DocumentoTramiteItemDto } from '../../modules/documentos/api/types'

const documentosCache = new Map<number, DocumentoTramiteUiItem[]>()

const getEstadoUi = (documento: DocumentoTramiteItemDto): DocumentoValidacionEstado => {
  if (!documento.documentoCargado) return 'PENDIENTE'
  const estado = documento.documentoUploadedResponse?.estadoDocumento?.toUpperCase()
  if (estado === 'APROBADO') return 'APROBADO'
  if (estado === 'RECHAZADO') return 'RECHAZADO'
  return 'POR_REVISAR'
}

export const getCachedDocumentos = (tramiteId: number) => documentosCache.get(tramiteId)

export const prefetchInscripcionDocumentos = async (tramiteId: number) => {
  if (documentosCache.has(tramiteId)) return
  const data = await getDocumentosByTramite(tramiteId)
  documentosCache.set(tramiteId, data.map((documento) => ({ ...documento, validacionEstado: getEstadoUi(documento), validacionObservaciones: documento.documentoUploadedResponse?.observacionesDocumento ?? null })))
}

export const invalidateInscripcionDocumentosCache = (tramiteId: number) => documentosCache.delete(tramiteId)
export { getEstadoUi }
