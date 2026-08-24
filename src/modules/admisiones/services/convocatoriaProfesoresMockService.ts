import { httpPost } from '../../../shared/http/httpClient'
import type { ApiResponse } from '../api/types'

type EvaluadorConvocatoriaRequest = {
  evaluadorUuid: string
  convocatoriaId: number
}

export async function assignProfesoresToConvocatoria(params: {
  convocatoriaId: number
  profesoresUuid: string[]
}): Promise<void> {
  const { convocatoriaId, profesoresUuid } = params

  for (const profesorUuid of profesoresUuid) {
    const payload: EvaluadorConvocatoriaRequest = {
      evaluadorUuid: profesorUuid,
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
