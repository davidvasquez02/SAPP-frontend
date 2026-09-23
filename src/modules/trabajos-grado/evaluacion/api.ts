import { httpDelete, httpGet, httpPost, httpPut } from '../../../shared/http/httpClient'
import type {
  ApiResponse,
  BancoJurado,
  CatalogosEvaluacion,
  DesignarJuradosRequest,
  HistorialProcesoEvaluacion,
  JuradoInput,
  ProcesoEvaluacionTg,
  ProgramarSustentacionRequest,
  RegistrarResultadoRequest,
} from './types'

const BASE = '/sapp/procesoEvaluacionTg'

const unwrap = <T>(response: ApiResponse<T>, fallback: string): T => {
  if (!response.ok) throw new Error(response.message || fallback)
  if (response.data == null) throw new Error(fallback)
  return response.data
}

export const getProcesoEvaluacion = async (solicitudId: number): Promise<ProcesoEvaluacionTg> =>
  unwrap(
    await httpGet<ApiResponse<ProcesoEvaluacionTg>>(`${BASE}/solicitud/${solicitudId}`),
    'No fue posible consultar el proceso de evaluación.',
  )

export const getHistorialProcesoEvaluacion = async (solicitudId: number): Promise<HistorialProcesoEvaluacion[]> =>
  unwrap(
    await httpGet<ApiResponse<HistorialProcesoEvaluacion[]>>(`${BASE}/solicitud/${solicitudId}/historial`),
    'No fue posible consultar la línea de tiempo del proceso.',
  )

export const getCatalogosEvaluacion = async (): Promise<CatalogosEvaluacion> =>
  unwrap(
    await httpGet<ApiResponse<CatalogosEvaluacion>>(`${BASE}/catalogos`),
    'No fue posible consultar los catálogos de evaluación.',
  )

export const buscarBancoJurados = async (query: string): Promise<BancoJurado[]> => {
  const response = await httpGet<ApiResponse<BancoJurado[]>>(`${BASE}/jurados/banco?q=${encodeURIComponent(query)}`)
  return unwrap(response, 'No fue posible consultar el banco de jurados.') ?? []
}

export const designarJurados = async (solicitudId: number, payload: DesignarJuradosRequest) =>
  unwrap(
    await httpPost<ApiResponse<ProcesoEvaluacionTg>>(`${BASE}/solicitud/${solicitudId}/jurados`, payload),
    'No fue posible designar los jurados.',
  )

export const reenviarInvitacion = async (solicitudId: number, juradoId: number) =>
  unwrap(
    await httpPost<ApiResponse<ProcesoEvaluacionTg>>(`${BASE}/solicitud/${solicitudId}/jurados/${juradoId}/reenviar-invitacion`),
    'No fue posible reenviar la invitación.',
  )

export const reemplazarJurado = async (solicitudId: number, juradoId: number, payload: JuradoInput) =>
  unwrap(
    await httpPut<ApiResponse<ProcesoEvaluacionTg>>(`${BASE}/solicitud/${solicitudId}/jurados/${juradoId}`, payload),
    'No fue posible reemplazar el jurado.',
  )

export const retirarJurado = async (solicitudId: number, juradoId: number) =>
  unwrap(
    await httpDelete<ApiResponse<ProcesoEvaluacionTg>>(`${BASE}/solicitud/${solicitudId}/jurados/${juradoId}`),
    'No fue posible retirar el jurado.',
  )

export const enviarRecordatorios = async (solicitudId: number): Promise<number> =>
  unwrap(
    await httpPost<ApiResponse<number>>(`${BASE}/solicitud/${solicitudId}/recordatorios`),
    'No fue posible enviar los recordatorios.',
  )

export const definirDocumentoEvaluar = async (solicitudId: number, documentoId: number) =>
  unwrap(
    await httpPut<ApiResponse<ProcesoEvaluacionTg>>(`${BASE}/solicitud/${solicitudId}/documento-evaluar/${documentoId}`),
    'No fue posible definir el documento a evaluar.',
  )

export const enviarAAjustes = async (solicitudId: number) =>
  unwrap(
    await httpPost<ApiResponse<ProcesoEvaluacionTg>>(`${BASE}/solicitud/${solicitudId}/ajustes`),
    'No fue posible enviar el trabajo a ajustes.',
  )

export const programarSustentacion = async (solicitudId: number, payload: ProgramarSustentacionRequest) =>
  unwrap(
    await httpPost<ApiResponse<ProcesoEvaluacionTg>>(`${BASE}/solicitud/${solicitudId}/sustentacion`, payload),
    'No fue posible programar la sustentación.',
  )

export const registrarResultado = async (solicitudId: number, payload: RegistrarResultadoRequest) =>
  unwrap(
    await httpPost<ApiResponse<ProcesoEvaluacionTg>>(`${BASE}/solicitud/${solicitudId}/resultado`, payload),
    'No fue posible registrar el resultado.',
  )
