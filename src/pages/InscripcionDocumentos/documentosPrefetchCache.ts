import { getDocumentosByTramite } from '../../modules/documentos/api/documentosService'
import type { DocumentoTramiteUiItem, DocumentoValidacionEstado } from '../../modules/documentos/types/ui'
import type { DocumentoTramiteItemDto } from '../../modules/documentos/api/types'

const documentosCache = new Map<number, DocumentoTramiteUiItem[]>()
const pendingRequests = new Map<number, Promise<void>>()

const getEstadoUi = (documento: DocumentoTramiteItemDto): DocumentoValidacionEstado => {
  if (!documento.documentoCargado) return 'PENDIENTE'
  const estado = documento.documentoUploadedResponse?.estadoDocumento?.toUpperCase()
  if (estado === 'APROBADO') return 'APROBADO'
  if (estado === 'RECHAZADO') return 'RECHAZADO'
  return 'POR_REVISAR'
}

export const getCachedDocumentos = (tramiteId: number) => documentosCache.get(tramiteId)

export const prefetchInscripcionDocumentos = (tramiteId: number): Promise<void> => {
  if (documentosCache.has(tramiteId)) return Promise.resolve()
  const pending = pendingRequests.get(tramiteId)
  if (pending) return pending
  const request = getDocumentosByTramite(tramiteId, false).then(data => {
    if (pendingRequests.get(tramiteId) !== request) return
    documentosCache.set(tramiteId, data.map((documento) => {
      const uploaded = documento.documentoUploadedResponse ? { ...documento.documentoUploadedResponse } : null
      // No conservar contenidos en esta cache, incluso durante un despliegue con un backend anterior.
      if (uploaded) {
        delete uploaded.base64DocumentoContenido
        delete uploaded.contenidoBase64
      }
      return { ...documento, documentoUploadedResponse: uploaded, validacionEstado: getEstadoUi(documento), validacionObservaciones: uploaded?.observacionesDocumento ?? null }
    }))
  }).finally(() => {
    if (pendingRequests.get(tramiteId) === request) pendingRequests.delete(tramiteId)
  })
  pendingRequests.set(tramiteId, request)
  return request
}

export const invalidateInscripcionDocumentosCache = (tramiteId: number) => {
  pendingRequests.delete(tramiteId)
  return documentosCache.delete(tramiteId)
}
export { getEstadoUi }
