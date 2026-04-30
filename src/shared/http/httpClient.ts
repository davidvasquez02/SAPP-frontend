import { clearSession, getToken } from '../../modules/auth/session/sessionStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

type HttpOptions = RequestInit & {
  auth?: boolean
}

const buildUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${BASE_URL}${normalizedPath}`
}

const resolveHeaders = (options?: HttpOptions) => {
  const headers = new Headers(options?.headers)
  const body = options?.body
  const isFormData = body instanceof FormData

  if (body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { auth = true, ...requestInit } = options
  const headers = resolveHeaders(options)
  const token = auth ? getToken() : null

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(buildUrl(path), {
    ...requestInit,
    headers,
  })

  if (response.status === 401 || response.status === 403) {
    clearSession()
    window.location.assign('/login')
    throw new Error('No autorizado')
  }

  if (!response.ok) {
    let errorMessage = `Error HTTP ${response.status}`

    try {
      const errorBody = (await response.json()) as { message?: string }
      if (errorBody?.message) {
        errorMessage = errorBody.message
      }
    } catch {
      // Ignore parse errors and keep the default message.
    }

    throw new Error(errorMessage)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const httpGet = <T>(path: string, options?: HttpOptions) =>
  http<T>(path, { ...options, method: 'GET' })

export const httpPost = <T>(path: string, body?: unknown, options?: HttpOptions) =>
  http<T>(path, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

export const httpPut = <T>(path: string, body?: unknown, options?: HttpOptions) =>
  http<T>(path, {
    ...options,
    method: 'PUT',
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })
