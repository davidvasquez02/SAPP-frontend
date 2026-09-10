import { httpGet, httpPost, httpPut } from '../../../shared/http/httpClient'
import type {
  ConvocatoriaAdmisionCloseResponse,
  ConvocatoriaAdmisionCreateResponse,
  ConvocatoriaAdmisionDatesUpdateResponse,
  ConvocatoriaAdmisionDto,
  ConvocatoriaAdmisionListResponse,
  CreateConvocatoriaRequest,
  UpdateConvocatoriaFechasRequest,
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
