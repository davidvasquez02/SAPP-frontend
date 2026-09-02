import { httpPost } from '../../../shared/http/httpClient'

export interface FirmaPerfil {
  nombreArchivo: string
  mimeType: string
  contenidoBase64: string
}

export interface GuardarFirmaUsuarioRequest {
  contenidoFirma: string
}

/**
 * Persiste la firma del UsuarioSapp autenticado.
 *
 * Pendiente de backend: incorporar el servicio de consulta de firma para poder
 * precargar aquí la firma vigente cuando se abra el selector del perfil.
 */
export const guardarFirmaUsuario = async (
  usuarioId: number,
  firma: FirmaPerfil,
): Promise<void> => {
  const payload: GuardarFirmaUsuarioRequest = {
    contenidoFirma: `data:${firma.mimeType};base64,${firma.contenidoBase64}`,
  }

  await httpPost<unknown>(`/sapp/firmaUsuario/${usuarioId}`, payload)
}
