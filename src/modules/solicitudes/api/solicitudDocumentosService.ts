import { httpGet } from '../../../shared/http/httpClient'
import type { ApiResponse } from '../../../api/types'
import type { DocumentChecklistItemDto } from '../../../api/documentChecklistTypes'
import type { SolicitudDocumentoAdjuntoDto } from '../types/documentosAdjuntos'

const buildDocumentoAdjunto = (item: DocumentChecklistItemDto): SolicitudDocumentoAdjuntoDto | null => {
  const uploaded = item.documentoUploadedResponse
  if (!uploaded) {
    return null
  }

  return {
    idDocumento: uploaded.idDocumento,
    nombreArchivo: uploaded.nombreArchivoDocumento,
    mimeType: uploaded.mimeTypeDocumentoContenido,
    base64Contenido: uploaded.base64DocumentoContenido,
    descripcion: item.descripcionTipoDocumentoTramite ?? item.nombreTipoDocumentoTramite,
    obligatorio: item.obligatorioTipoDocumentoTramite,
  }
}

export const getSolicitudDocumentosAdjuntos = async ({
  tramiteId,
  codigoTipoTramiteId,
}: {
  tramiteId: number
  codigoTipoTramiteId: number
}): Promise<SolicitudDocumentoAdjuntoDto[]> => {
  const qs = new URLSearchParams({
    tramiteId: String(tramiteId),
    codigoTipoTramiteId: String(codigoTipoTramiteId),
  })

  const response = await httpGet<ApiResponse<DocumentChecklistItemDto[]>>(`/sapp/document?${qs.toString()}`)
  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los documentos adjuntos.')
  }

  return (response.data ?? [])
    .map((item) => buildDocumentoAdjunto(item))
    .filter((item): item is SolicitudDocumentoAdjuntoDto => item !== null)
}
