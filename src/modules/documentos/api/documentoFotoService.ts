import { httpGet } from '../../../shared/http/httpClient'
import type { ApiResponse } from '../../../api/types'
import { getDocumentosByTramiteParams } from './documentosService'
import type { DocumentoUploadedResponseDto } from './types'

interface DocumentoFotoParams {
  codigoTipoTramite: string | number
  codigoTipoDocumentoTramite: string
  tramiteId: number
}

interface DocumentoFotoPorTramiteParams {
  codigoTipoTramite: string | number
  codigoTipoDocumentoTramite: string
  tramiteIds: number[]
}

interface FotoPorTramiteDto {
  tramiteId: number
  documentoUploadedResponse: DocumentoUploadedResponseDto | null
}

const buildDataUri = (base64: string, mimeType?: string): string => {
  const safeMimeType = mimeType || 'image/jpeg'
  return `data:${safeMimeType};base64,${base64}`
}

const buildDataUriFromUploaded = (uploaded: DocumentoUploadedResponseDto | null): string | null => {
  if (!uploaded) {
    return null
  }

  const base64 = uploaded.base64DocumentoContenido || uploaded.contenidoBase64
  const resolvedMimeType = uploaded.mimeTypeDocumentoContenido || uploaded.mimeType

  if (!base64) {
    return null
  }

  return buildDataUri(base64, resolvedMimeType)
}

export const getFotoDocumentoByTramite = async ({
  codigoTipoTramite,
  codigoTipoDocumentoTramite,
  tramiteId,
}: DocumentoFotoParams): Promise<string | null> => {
  const documentos = await getDocumentosByTramiteParams({
    codigoTipoTramite,
    codigoTipoDocumentoTramite,
    tramiteId,
  })

  const fotoDocumento = documentos.find(
    (documento) => documento.codigoTipoDocumentoTramite === codigoTipoDocumentoTramite
  )

  if (!fotoDocumento?.documentoCargado || !fotoDocumento.documentoUploadedResponse) {
    return null
  }

  const { base64DocumentoContenido, mimeTypeDocumentoContenido, mimeType, contenidoBase64 } =
    fotoDocumento.documentoUploadedResponse

  const base64 = base64DocumentoContenido || contenidoBase64
  const resolvedMimeType = mimeTypeDocumentoContenido || mimeType

  if (!base64) {
    return null
  }

  return buildDataUri(base64, resolvedMimeType)
}

export const getFotosDocumentoByTramites = async ({
  codigoTipoTramite,
  codigoTipoDocumentoTramite,
  tramiteIds,
}: DocumentoFotoPorTramiteParams): Promise<Record<number, string>> => {
  const uniqueTramiteIds = [...new Set(tramiteIds)].filter((id) => id > 0)

  const pairs = await Promise.all(
    uniqueTramiteIds.map(async (tramiteId) => {
      try {
        const fotoUrl = await getFotoDocumentoByTramite({
          codigoTipoTramite,
          codigoTipoDocumentoTramite,
          tramiteId,
        })

        return [tramiteId, fotoUrl] as const
      } catch {
        return [tramiteId, null] as const
      }
    }),
  )

  return pairs.reduce<Record<number, string>>((acc, [tramiteId, fotoUrl]) => {
    if (fotoUrl) {
      acc[tramiteId] = fotoUrl
    }
    return acc
  }, {})
}

/**
 * Igual que getFotosDocumentoByTramites, pero en una sola petición HTTP en vez de una por
 * tramiteId: evita que un listado (ej. el módulo de estudiantes) agote el rate limit del gateway
 * (429). Los tramites sin ese documento cargado simplemente no aparecen en el mapa resultante.
 */
export const getFotosDocumentoByTramitesBulk = async ({
  codigoTipoTramite,
  codigoTipoDocumentoTramite,
  tramiteIds,
}: DocumentoFotoPorTramiteParams): Promise<Map<number, string>> => {
  const uniqueTramiteIds = [...new Set(tramiteIds)].filter((id) => Number.isFinite(id) && id > 0)

  if (uniqueTramiteIds.length === 0) {
    return new Map()
  }

  const response = await httpGet<ApiResponse<FotoPorTramiteDto[]>>(
    `/sapp/document/fotos?codigoTipoTramite=${encodeURIComponent(String(codigoTipoTramite))}` +
      `&codigoTipoDocumentoTramite=${encodeURIComponent(codigoTipoDocumentoTramite)}` +
      `&tramiteIds=${uniqueTramiteIds.join(',')}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar las fotos de los trámites')
  }

  const fotos = new Map<number, string>()
  for (const item of response.data ?? []) {
    const fotoUrl = buildDataUriFromUploaded(item.documentoUploadedResponse)
    if (fotoUrl) {
      fotos.set(item.tramiteId, fotoUrl)
    }
  }

  return fotos
}
