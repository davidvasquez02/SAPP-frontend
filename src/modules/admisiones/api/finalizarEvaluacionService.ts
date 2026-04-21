import { httpGet, httpPost, httpPut } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'

type HttpMethod = 'PUT' | 'POST' | 'GET'

const FINALIZAR_EVALUACION_HTTP_METHOD: HttpMethod = 'POST'

const requestWithoutBody = async (path: string): Promise<ApiResponse<unknown>> => {
  switch (FINALIZAR_EVALUACION_HTTP_METHOD) {
    case 'POST':
      return httpPost<ApiResponse<unknown>>(path)
    case 'GET':
      return httpGet<ApiResponse<unknown>>(path)
    case 'PUT':
    default:
      return httpPut<ApiResponse<unknown>>(path)
  }
}

export async function calcularPuntajes(inscripcionId: number): Promise<void> {
  const response = await requestWithoutBody(
    `/sapp/evaluacionAdmision/calcularPuntajes/${inscripcionId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible calcular los puntajes finales.')
  }
}

export async function finalizarEvaluacion(inscripcionId: number): Promise<void> {
  const response = await requestWithoutBody(
    `/sapp/evaluacionAdmision/finalizarEvaluacion/${inscripcionId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible finalizar la evaluación.')
  }
}
