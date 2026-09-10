import { getDocumentosByTramiteParams } from '../../../documentos/api/documentosService'
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

export const prefetchHojaVidaDocumento = async (inscripcionId: number) => {
  if (hojaVidaDocCache.has(inscripcionId)) return
  const documentos = await getDocumentosByTramiteParams({ tramiteId: inscripcionId, codigoTipoTramite: CODIGO_TIPO_TRAMITE_ADMISION_COORDINACION, codigoTipoDocumentoTramite: CODIGO_TIPO_DOCUMENTO_HOJA_DE_VIDA_COORDINACION })
  const uploaded = documentos[0]?.documentoUploadedResponse
  const base64 = uploaded?.base64DocumentoContenido || uploaded?.contenidoBase64
  if (!uploaded || !base64) return
  hojaVidaDocCache.set(inscripcionId, { base64, mimeType: uploaded?.mimeTypeDocumentoContenido || uploaded?.mimeType || 'application/pdf', filename: uploaded?.nombreArchivoDocumento || 'hoja-de-vida.pdf' })
}
