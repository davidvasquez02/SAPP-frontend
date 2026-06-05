import { httpGet } from '../../../shared/http/httpClient'
import { CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE } from '../constants'
import type { ApiResponse, DocumentoTramiteItemDto } from './types'


export interface DocumentoEstudianteMetadataDto {
  id: number | null
  estado: string | null
  fechaCarga: string | null
  mimeType: string | null
  nombreArchivo: string | null
  secuencia: number | null
  tamanoBytes: number | null
  tipoDocumento: string | null
  tipoDocumentoTramiteId: number | null
  version: number | null
}

export interface DocumentosEstudianteGrupoDto {
  tipoTramite: string | null
  periodo: string | null
  tramiteId: number | null
  documentos: DocumentoEstudianteMetadataDto[]
}

export interface DocumentoCompletoDto {
  aspiranteCargaId?: number | null
  checksum?: string | null
  contenidoBase64: string
  estado?: string | null
  fechaRevision?: string | null
  id: number
  mimeType: string | null
  nombreArchivo: string | null
  observaciones?: string | null
  tamanoBytes?: number | null
  usuarioCargaId?: number | null
  version?: number | null
}

interface DocumentosByTramiteParams {
  tramiteId: number
  codigoTipoTramite: string | number
  codigoTipoDocumentoTramite?: string
}

export const getDocumentosByTramiteParams = async ({
  tramiteId,
  codigoTipoTramite,
  codigoTipoDocumentoTramite,
}: DocumentosByTramiteParams): Promise<DocumentoTramiteItemDto[]> => {
  const qs = new URLSearchParams({
    codigoTipoTramite: String(codigoTipoTramite),
    tramiteId: String(tramiteId),
  })

  if (codigoTipoDocumentoTramite) {
    qs.set('codigoTipoDocumentoTramite', codigoTipoDocumentoTramite)
  }

  const response = await httpGet<ApiResponse<DocumentoTramiteItemDto[]>>(
    `/sapp/document?${qs.toString()}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'Consulta fallida')
  }

  return response.data
}

export const getDocumentosByTramite = async (
  tramiteId: number,
): Promise<DocumentoTramiteItemDto[]> => {
  return getDocumentosByTramiteParams({
    tramiteId,
    codigoTipoTramite: CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE,
  })
}

export const getDocumentsByEstudiante = async (
  codigoEstudianteUis: string | number,
): Promise<DocumentosEstudianteGrupoDto[]> => {
  const response = await httpGet<ApiResponse<DocumentosEstudianteGrupoDto[]>>(
    `/sapp/document/by-estudiante/${encodeURIComponent(String(codigoEstudianteUis))}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los documentos del estudiante.')
  }

  return response.data ?? []
}

export const getDocumentById = async (
  documentoId: string | number,
): Promise<DocumentoCompletoDto> => {
  const response = await httpGet<ApiResponse<DocumentoCompletoDto>>(
    `/sapp/document/${encodeURIComponent(String(documentoId))}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar el documento solicitado.')
  }

  return response.data
}
