import { httpGet, httpPost, httpPut } from '../../../shared/http/httpClient'
import type { ApiResponse } from './types'

type HttpMethod = 'PUT' | 'POST' | 'GET'

const FINALIZAR_EVALUACION_HTTP_METHOD = 'POST' as HttpMethod

const requestByMethod: Record<HttpMethod, (path: string) => Promise<ApiResponse<unknown>>> = {
  GET: (path) => httpGet<ApiResponse<unknown>>(path),
  POST: (path) => httpPost<ApiResponse<unknown>>(path),
  PUT: (path) => httpPut<ApiResponse<unknown>>(path),
}

const requestWithoutBody = async (path: string): Promise<ApiResponse<unknown>> =>
  requestByMethod[FINALIZAR_EVALUACION_HTTP_METHOD](path)

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
