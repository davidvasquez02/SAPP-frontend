import { httpPost } from '../../../shared/http/httpClient'

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
    const response = await httpPost<unknown, EvaluadorConvocatoriaRequest>(
      '/sapp/evaluadorConvocatoria',
      {
        evaluadorId: profesorId,
        convocatoriaId,
      }
    )

    if (!response.ok) {
      throw new Error(response.message || 'No fue posible asociar los profesores a la convocatoria.')
    }
  }
}
