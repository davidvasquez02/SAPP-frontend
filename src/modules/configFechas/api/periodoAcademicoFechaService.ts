import type { ApiResponse } from '../../../api/types'
import { http } from '../../../shared/http/httpClient'
import type { PeriodoAcademicoFechaRequestDto } from './types'

export async function savePeriodoAcademicoFecha(
  request: PeriodoAcademicoFechaRequestDto
): Promise<void> {
  const response = await http<ApiResponse<null>>('/api/sapp/periodoAcademicoFecha', {
    method: 'POST',
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible guardar la configuración de fechas')
  }
}
