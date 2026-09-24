import * as AuthStorage from '../../context/Auth/AuthStorage'
import { API_URL } from '../../api/config'
import type { FiltrosLiquidaciones, LiquidacionMatricula, MiLiquidacion, ProcesoLiquidacion, RespuestasLiquidacion, ResultadoEnvio, StandardResponse } from './types'

const base = `${API_URL.replace(/\/+$/, '')}/liquidacionMatricula`

export class LiquidacionApiError extends Error {
  status: number
  fields?: Record<string, string> | null
  constructor(message: string, status: number, fields?: Record<string, string> | null) { super(message); this.status = status; this.fields = fields }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = AuthStorage.getSession()?.accessToken
  const headers = new Headers(init.headers)
  if (token) headers.set('X-Internal-Token', token)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${base}${path}`, { ...init, headers })
  const payload = await response.json().catch(() => null) as StandardResponse<T> | null
  if (!response.ok || !payload?.ok) throw new LiquidacionApiError(payload?.message || `Error ${response.status}`, response.status, payload?.data as Record<string, string> | null)
  return payload.data
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) })
export const listarProcesos = (periodoId?: number) => call<ProcesoLiquidacion[]>(`/procesos${periodoId ? `?periodoId=${periodoId}` : ''}`)
export const obtenerProceso = (id: number) => call<ProcesoLiquidacion>(`/procesos/${id}`)
export const crearProceso = (body: unknown) => call<ProcesoLiquidacion>('/procesos', json('POST', body))
export const actualizarProceso = (id: number, body: unknown) => call<ProcesoLiquidacion>(`/procesos/${id}`, json('PUT', body))
export const listarLiquidaciones = (id: number, filtros: FiltrosLiquidaciones = {}) => {
  const query = new URLSearchParams(Object.entries(filtros).filter(([, value]) => value !== '' && value !== undefined).map(([key, value]) => [key, String(value)]))
  return call<LiquidacionMatricula[]>(`/procesos/${id}/liquidaciones?${query}`)
}
export const ejecutarAccionProceso = (id: number, accion: 'convocar' | 'enviarSolicitudes' | 'enviarRecordatorio' | 'cerrar' | 'reabrir' | 'recalcular', body?: unknown) => call<ResultadoEnvio | ProcesoLiquidacion>(`/procesos/${id}/${accion}`, json('POST', body))
export const publicarProceso = (id: number, fechaLimitePago: string) => call<ResultadoEnvio>(`/procesos/${id}/publicar`, json('POST', { fechaLimitePago }))
export const obtenerLiquidacion = (id: number) => call<LiquidacionMatricula>(`/liquidaciones/${id}`)
export const actualizarLiquidacion = (id: number, accion: 'respuestas' | 'ajustes' | 'excluir' | 'reincluir' | 'liquidada', body?: unknown) => call<LiquidacionMatricula>(`/liquidaciones/${id}/${accion}`, json('PUT', body))
export const agregarLiquidacion = (procesoId: number, body: { estudianteId: number; tipoEstudiante: string }) => call<LiquidacionMatricula>(`/procesos/${procesoId}/liquidaciones`, json('POST', body))
export const buscarEstudiantes = (query: string) => call<Array<{ id: number; codigoNombre: string }>>(`/estudiantes?query=${encodeURIComponent(query)}`)
export const listarTarifas = (programaId: number) => call<unknown[]>(`/tarifas?programaId=${programaId}`)
export const actualizarTarifa = (id: number, body: unknown) => call<unknown>(`/tarifas/${id}`, json('PUT', body))
export const listarMisLiquidaciones = () => call<MiLiquidacion[]>('/mias')
export const responderMiLiquidacion = (id: number, respuestas: Partial<RespuestasLiquidacion>) => call<MiLiquidacion>(`/mias/${id}/respuestas`, json('PUT', respuestas))

export async function exportarProceso(id: number): Promise<void> {
  const token = AuthStorage.getSession()?.accessToken
  const response = await fetch(`${base}/procesos/${id}/exportar`, { headers: token ? { 'X-Internal-Token': token } : {} })
  if (!response.ok) { const error = await response.json().catch(() => null); throw new LiquidacionApiError(error?.message || `Error ${response.status}`, response.status) }
  const blob = await response.blob(); const url = URL.createObjectURL(blob)
  const disposition = response.headers.get('Content-Disposition') || ''
  const name = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1] || `liquidaciones-${id}.xlsx`
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = decodeURIComponent(name); anchor.click(); URL.revokeObjectURL(url)
}
