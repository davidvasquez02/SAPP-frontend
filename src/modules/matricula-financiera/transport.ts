import type { StandardResponse } from './types'

export class LiquidacionApiError extends Error {
  status: number
  fields?: Record<string, string> | null
  constructor(message: string, status: number, fields?: Record<string, string> | null) {
    super(message); this.status = status; this.fields = fields
  }
}
interface SessionAccess { getSession: () => { accessToken?: string } | null; clearSession: () => void }
export function createLiquidacionClient(apiUrl: string, session: SessionAccess) {
  const root = apiUrl.replace(/\/+$/, '')
  const headersFor = (init: RequestInit) => {
    const headers = new Headers(init.headers)
    const token = session.getSession()?.accessToken
    if (token) headers.set('X-Internal-Token', token)
    if (init.body) headers.set('Content-Type', 'application/json')
    return headers
  }
  const checkResponse = async (response: Response) => {
    if (response.status === 401) session.clearSession()
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.ok) {
      const fields = payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
        ? Object.fromEntries(Object.entries(payload.data).filter(([, value]) => typeof value === 'string')) as Record<string, string> : null
      throw new LiquidacionApiError(payload?.message || (response.status === 401 ? 'La sesión venció. Recarga la página para volver a ingresar.' : `Error ${response.status}`), response.status, fields)
    }
    return payload
  }
  const call = async <T>(path: string, init: RequestInit = {}, sibling = false): Promise<T> => {
    const response = await fetch(`${root}${sibling ? '' : '/liquidacionMatricula'}${path}`, { ...init, headers: headersFor(init) })
    const payload = await checkResponse(response) as StandardResponse<T>
    return payload.data
  }
  const file = async (path: string) => {
    const response = await fetch(`${root}/liquidacionMatricula${path}`, { headers: headersFor({}) })
    if (!response.ok) await checkResponse(response)
    return response
  }
  return { call, file }
}
