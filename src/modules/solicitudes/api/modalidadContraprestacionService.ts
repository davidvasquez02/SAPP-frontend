import { httpGet } from '../../../shared/http/httpClient'
import type { ApiResponse, ModalidadContraprestacionDto } from './types'

export async function getModalidadesContraprestacion(): Promise<ModalidadContraprestacionDto[]> {
  const response = await httpGet<ApiResponse<ModalidadContraprestacionDto[]>>('/sapp/modalidadContraprestacion')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar modalidades de contraprestación.')
  }

  return response.data ?? []
}
