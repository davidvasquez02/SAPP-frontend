import { getDocumentosByTramiteParams } from './documentosService'

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

const buildDataUri = (base64: string, mimeType?: string): string => {
  const safeMimeType = mimeType || 'image/jpeg'
  return `data:${safeMimeType};base64,${base64}`
}

export const getFotoDocumentoByTramite = async ({
  codigoTipoTramite,
  codigoTipoDocumentoTramite,
  tramiteId,
}: DocumentoFotoParams): Promise<string | null> => {
  const documentos = await getDocumentosByTramiteParams({
    codigoTipoTramite,
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
