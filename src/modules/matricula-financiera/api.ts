import * as AuthStorage from '../../context/Auth/AuthStorage'
import { API_URL } from '../../api/config'
import type { DocumentChecklistItemDto } from '../../api/documentChecklistTypes'
import type { DocumentUploadRequest, DocumentUploadResponseDto } from '../../api/documentUploadTypes'
import type { CuerposAcciones, CuerposLiquidacion, CrearProcesoRequest, EstudianteBusqueda, FiltrosLiquidaciones, LiquidacionMatricula, MiLiquidacion, ParametrosProceso, PeriodoFinanciera, ProcesoLiquidacion, ProgramaFinanciera, RespuestasRequest, ResultadoAcciones, ResultadoEnvio, TarifaMatricula, TarifaRequest, TipoEstudianteLiquidacion } from './types'

export { LiquidacionApiError } from './transport'
import { createLiquidacionClient } from './transport'
const { call, file } = createLiquidacionClient(API_URL, AuthStorage)
const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) })
export const listarProcesos = (periodoId?: number, signal?: AbortSignal) => call<ProcesoLiquidacion[]>(`/procesos${periodoId ? `?periodoId=${periodoId}` : ''}`, { signal })
export const obtenerProceso = (id: number, signal?: AbortSignal) => call<ProcesoLiquidacion>(`/procesos/${id}`, { signal })
export const crearProceso = (body: CrearProcesoRequest) => call<ProcesoLiquidacion>('/procesos', json('POST', body))
export const actualizarProceso = (id: number, body: ParametrosProceso) => call<ProcesoLiquidacion>(`/procesos/${id}`, json('PUT', body))
export const listarLiquidaciones = (id: number, filtros: FiltrosLiquidaciones = {}, signal?: AbortSignal) => {
  const query = new URLSearchParams(Object.entries(filtros).filter(([, value]) => value !== '' && value !== undefined).map(([key, value]) => [key, String(value)]))
  return call<LiquidacionMatricula[]>(`/procesos/${id}/liquidaciones?${query}`, { signal })
}
export const ejecutarAccionProceso = <K extends keyof ResultadoAcciones>(id: number, accion: K, body?: CuerposAcciones[K]) => call<ResultadoAcciones[K]>(`/procesos/${id}/${accion}`, json('POST', body))
export const publicarProceso = (id: number, fechaLimitePago: string) => call<ResultadoEnvio>(`/procesos/${id}/publicar`, json('POST', { fechaLimitePago }))
export const obtenerLiquidacion = (id: number, signal?: AbortSignal) => call<LiquidacionMatricula>(`/liquidaciones/${id}`, { signal })
export const actualizarLiquidacion = <K extends keyof CuerposLiquidacion>(id: number, accion: K, body?: CuerposLiquidacion[K]) => call<LiquidacionMatricula>(`/liquidaciones/${id}/${accion}`, json('PUT', body))
export const agregarLiquidacion = (procesoId: number, body: { estudianteId: number; tipoEstudiante: TipoEstudianteLiquidacion }) => call<LiquidacionMatricula>(`/procesos/${procesoId}/liquidaciones`, json('POST', body))
// Buscador existente del catálogo de estudiantes, fuera del controlador financiero.
export const buscarEstudiantes = (query: string, signal?: AbortSignal) => call<EstudianteBusqueda[]>(`/estudiantes?query=${encodeURIComponent(query)}`, { signal }, true)
export const listarPeriodos = (signal?: AbortSignal) => call<PeriodoFinanciera[]>('/periodoAcademico', { signal }, true)
export const listarProgramas = (signal?: AbortSignal) => call<ProgramaFinanciera[]>('/programaAcademico', { signal }, true)
export const listarTarifas = (programaId: number, signal?: AbortSignal) => call<TarifaMatricula[]>(`/tarifas?programaId=${programaId}`, { signal })
export const actualizarTarifa = (id: number, body: TarifaRequest) => call<TarifaMatricula>(`/tarifas/${id}`, json('PUT', body))
export const listarMisLiquidaciones = (signal?: AbortSignal) => call<MiLiquidacion[]>('/mias', { signal })
export const responderMiLiquidacion = (id: number, respuestas: RespuestasRequest) => call<MiLiquidacion>(`/mias/${id}/respuestas`, json('PUT', respuestas))
export const listarCertificados = (id: number, signal?: AbortSignal) => call<DocumentChecklistItemDto[]>(`/document?codigoTipoTramite=1018&tramiteId=${id}`, { signal }, true)
export const cargarCertificado = (body: DocumentUploadRequest) => call<DocumentUploadResponseDto>('/document', json('POST', body), true)
export async function exportarProceso(id: number): Promise<void> {
  const response = await file(`/procesos/${id}/exportar`)
  const blob = await response.blob(); const url = URL.createObjectURL(blob)
  const disposition = response.headers.get('Content-Disposition') || ''
  const raw = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1] || disposition.match(/filename="?([^";]+)/i)?.[1]
  let name = raw || `liquidaciones-${id}.xlsx`
  try { name = decodeURIComponent(name) } catch { /* Conservar el nombre no codificado. */ }
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
