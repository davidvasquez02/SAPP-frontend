import { httpGet, httpPost } from '../../../shared/http/httpClient'
import type { ApiResponse } from '../../../api/types'

export interface FirmaPerfil {
  nombreArchivo: string
  mimeType: string
  contenidoBase64: string
}

export interface GuardarFirmaUsuarioRequest {
  titulo?: string
  contenidoFirma: string
}

interface FirmaUsuarioDto {
  titulo: string
  contenidoFirma: string
}

export interface FirmaUsuario {
  titulo: string
  contenidoFirma: string
}

export const obtenerFirmaUsuario = async (usuarioId: number): Promise<FirmaUsuario | null> => {
  const response = await httpGet<ApiResponse<FirmaUsuarioDto | null> | FirmaUsuarioDto>(
    `/sapp/firmaUsuario/${usuarioId}`,
  )
  const firma = 'data' in response ? response.data : response

  if ('ok' in response && !response.ok) {
    throw new Error(response.message || 'No fue posible consultar la firma.')
  }

  if (!firma?.contenidoFirma) return null

  return {
    titulo: firma.titulo ?? '',
    contenidoFirma: firma.contenidoFirma,
  }
}

export const guardarFirmaUsuario = async (
  usuarioId: number,
  titulo: string | undefined,
  firma: FirmaPerfil,
): Promise<void> => {
  const payload: GuardarFirmaUsuarioRequest = {
    ...(titulo !== undefined ? { titulo: titulo.trim() } : {}),
    contenidoFirma: `data:${firma.mimeType};base64,${firma.contenidoBase64}`,
  }

  await httpPost<unknown>(`/sapp/firmaUsuario/${usuarioId}`, payload)
}
