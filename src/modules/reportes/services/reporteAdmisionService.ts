import type { ApiResponse } from '../../../api/types'
import { httpPost } from '../../../shared/http/httpClient'

export interface GenerarReporteAdmisionRequest {
  actaId: number
  convocatoriaId: number
}

export async function generarReporteAdmision({
  actaId,
  convocatoriaId,
}: GenerarReporteAdmisionRequest): Promise<string> {
  const query = new URLSearchParams({
    actaId: String(actaId),
    convocatoriaId: String(convocatoriaId),
  })
  const response = await httpPost<ApiResponse<unknown>>(
    `/sapp/reportesAdmision/generar?${query.toString()}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible generar el informe de admisión.')
  }

  return response.message || 'El informe de admisión fue generado correctamente.'
}
