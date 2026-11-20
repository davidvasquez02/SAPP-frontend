import { httpFile, httpGet, httpPost, httpPut } from '../../../shared/http/httpClient'
import type { HttpFileResponse } from '../../../shared/http/httpClient'
import type {
  ConvocatoriaAdmisionCloseResponse,
  ConvocatoriaAdmisionCreateResponse,
  ConvocatoriaAdmisionDatesUpdateResponse,
  ConvocatoriaAdmisionDto,
  ConvocatoriaAdmisionListResponse,
  CreateConvocatoriaRequest,
  EvaluadoresConvocatoriaResponse,
  EvaluadorConvocatoriaDto,
  UpdateConvocatoriaFechasRequest,
  UpdateConvocatoriaRequest,
} from './convocatoriaAdmisionTypes'

export const getConvocatoriasAdmision = async (): Promise<ConvocatoriaAdmisionDto[]> => {
  const response = await httpGet<ConvocatoriaAdmisionListResponse>('/sapp/convocatoriaAdmision')

  if (!response.ok) {
    throw new Error(response.message || 'Error al obtener las convocatorias')
  }

  return response.data ?? []
}

export const updateConvocatoriaAdmisionFechas = async (
  convocatoriaId: number,
  request: UpdateConvocatoriaFechasRequest
): Promise<void | ConvocatoriaAdmisionDto> => {
  const response = await httpPut<ConvocatoriaAdmisionDatesUpdateResponse>(
    `/sapp/convocatoriaAdmision/fechas/${convocatoriaId}`,
    request
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al actualizar las fechas de la convocatoria')
  }

  return response.data ?? undefined
}

/** Edita fechas, cupos y observaciones; el servidor lo rechaza si la entrevista de algún aspirante ya se inició. */
export const updateConvocatoriaAdmision = async (
  convocatoriaId: number,
  request: UpdateConvocatoriaRequest
): Promise<void | ConvocatoriaAdmisionDto> => {
  const response = await httpPut<ConvocatoriaAdmisionDatesUpdateResponse>(
    `/sapp/convocatoriaAdmision/${convocatoriaId}`,
    request
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al actualizar la convocatoria')
  }

  return response.data ?? undefined
}

export const createConvocatoriaAdmision = async (
  request: CreateConvocatoriaRequest
): Promise<void | ConvocatoriaAdmisionDto> => {
  const response = await httpPost<ConvocatoriaAdmisionCreateResponse>(
    '/sapp/convocatoriaAdmision',
    request
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al crear la convocatoria')
  }

  return response.data ?? undefined
}

export const cerrarConvocatoriaAdmision = async (convocatoriaId: number): Promise<void> => {
  const response = await httpPut<ConvocatoriaAdmisionCloseResponse>(
    `/sapp/convocatoriaAdmision/cerrar/${convocatoriaId}`
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al cerrar la convocatoria')
  }
}

export const getEvaluadoresConvocatoria = async (
  convocatoriaId: number,
): Promise<EvaluadorConvocatoriaDto[]> => {
  const response = await httpGet<EvaluadoresConvocatoriaResponse>(
    `/sapp/evaluadorConvocatoria/convocatoria/${convocatoriaId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar los evaluadores de la convocatoria')
  }

  return response.data ?? []
}

/**
 * Zip con los documentos de todos los aspirantes de una convocatoria finalizada: carpetas Admitidos y No admitidos, y dentro
 * de cada aspirante las carpetas de su expediente. El backend rechaza la descarga si la convocatoria sigue abierta.
 */
export const downloadDocumentosAspirantesConvocatoria = async (
  convocatoriaId: number,
): Promise<HttpFileResponse> =>
  httpFile(`/sapp/convocatoriaAdmision/${encodeURIComponent(convocatoriaId)}/documentos-zip`, { method: 'GET' })
