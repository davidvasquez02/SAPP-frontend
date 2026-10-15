import { getDocumentById, getDocumentosByTramiteParams } from '../../../documentos/api/documentosService'
import {
  CODIGO_TIPO_DOCUMENTO_HOJA_DE_VIDA_COORDINACION,
  CODIGO_TIPO_TRAMITE_ADMISION_COORDINACION,
} from '../../../documentos/constants'
import { getEvaluacionAdmisionInfo } from '../../api/evaluacionAdmisionService'
import type { EtapaEvaluacion, EvaluacionAdmisionItem } from '../../types/evaluacionAdmisionTypes'

interface HojaVidaPreviewDocument { base64: string; mimeType: string; filename: string }

export const evaluacionCache = new Map<string, EvaluacionAdmisionItem[]>()
export const hojaVidaDocCache = new Map<number, HojaVidaPreviewDocument>()

export const prefetchEvaluacionEtapa = async (inscripcionId: number, etapa: EtapaEvaluacion) => {
  const cacheKey = `${inscripcionId}-${etapa}`
  if (evaluacionCache.has(cacheKey)) return
  evaluacionCache.set(cacheKey, await getEvaluacionAdmisionInfo(inscripcionId, etapa))
}

/** Solo invocar al abrir la seccion Hoja de vida; el detalle no precarga archivos. */
export const cargarHojaVidaDocumento = async (inscripcionId: number): Promise<HojaVidaPreviewDocument | null> => {
  const cached = hojaVidaDocCache.get(inscripcionId)
  if (cached) return cached
  const documentos = await getDocumentosByTramiteParams({ tramiteId: inscripcionId, codigoTipoTramite: CODIGO_TIPO_TRAMITE_ADMISION_COORDINACION, codigoTipoDocumentoTramite: CODIGO_TIPO_DOCUMENTO_HOJA_DE_VIDA_COORDINACION, incluirContenido: false })
  const uploaded = documentos[0]?.documentoUploadedResponse
  if (!uploaded?.idDocumento) return null
  const file = await getDocumentById(uploaded.idDocumento)
  if (!file.contenidoBase64) return null
  const resolved = { base64: file.contenidoBase64, mimeType: file.mimeType || uploaded.mimeTypeDocumentoContenido || 'application/pdf', filename: file.nombreArchivo || uploaded.nombreArchivoDocumento || 'hoja-de-vida.pdf' }
  hojaVidaDocCache.set(inscripcionId, resolved)
  return resolved
}
