import { httpPost } from '../../../shared/http/httpClient'
import type { ApiResponse } from '../api/types'

type EvaluadorConvocatoriaRequest = {
  evaluadorId: number
  convocatoriaId: number
}

export async function assignProfesoresToConvocatoria(params: {
  convocatoriaId: number
  profesoresId: number[]
}): Promise<void> {
  const { convocatoriaId, profesoresId } = params

  for (const profesorId of profesoresId) {
    const payload: EvaluadorConvocatoriaRequest = {
      evaluadorId: profesorId,
      convocatoriaId,
    }

    const response = await httpPost<ApiResponse<unknown>>(
      '/sapp/evaluadorConvocatoria',
      payload,
    )

    if (!response.ok) {
      throw new Error(response.message || 'No fue posible asociar los profesores a la convocatoria.')
    }
  }
}
