import { clearSession, getToken } from '../../modules/auth/session/sessionStore'
import { API_URL } from '../../api/config'

type HttpOptions = RequestInit & {
  auth?: boolean
  redirectOnUnauthorized?: boolean
}

interface ApiErrorBody {
  message?: string
  error?: string
  errors?: unknown
}

const stringifyValidationErrors = (errors: unknown): string | null => {
  if (Array.isArray(errors)) {
    const messages = errors
      .map((error) => {
        if (typeof error === 'string') return error
        if (error && typeof error === 'object') {
          const detail = error as Record<string, unknown>
          const field = typeof detail.field === 'string' ? `${detail.field}: ` : ''
          const message = detail.message ?? detail.defaultMessage
          return typeof message === 'string' ? `${field}${message}` : null
        }
        return null
      })
      .filter((message): message is string => Boolean(message))

    return messages.length > 0 ? messages.join(' · ') : null
  }

  if (errors && typeof errors === 'object') {
    const messages = Object.entries(errors as Record<string, unknown>)
      .map(([field, message]) =>
        typeof message === 'string' ? `${field}: ${message}` : null,
      )
      .filter((message): message is string => Boolean(message))

    return messages.length > 0 ? messages.join(' · ') : null
  }

  return null
}

const isAbsoluteUrl = (path: string) => path.startsWith('http://') || path.startsWith('https://')

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const normalizePath = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const normalizedApiUrl = trimTrailingSlash(API_URL)

  if (normalizedApiUrl.endsWith('/sapp') && normalizedPath.startsWith('/api/sapp/')) {
    return normalizedPath.replace(/^\/api\/sapp/, '')
  }

  if (normalizedApiUrl.endsWith('/sapp') && normalizedPath.startsWith('/sapp/')) {
    return normalizedPath.replace(/^\/sapp/, '')
  }

  return normalizedPath
}

const buildUrl = (path: string) => {
  if (isAbsoluteUrl(path)) {
    return path
  }

  return `${trimTrailingSlash(API_URL)}${normalizePath(path)}`
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
  const { auth = true, redirectOnUnauthorized = true, ...requestInit } = options
  const headers = resolveHeaders(options)
  const token = auth ? getToken() : null

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(buildUrl(path), {
    ...requestInit,
    headers,
  })

  if (redirectOnUnauthorized && (response.status === 401 || response.status === 403)) {
    if (response.status === 401) {
      clearSession()
    }
    throw new Error('No autorizado')
  }

  if (!response.ok) {
    let errorMessage = `Error HTTP ${response.status}`

    try {
      const errorBody = (await response.json()) as ApiErrorBody
      const validationDetails = stringifyValidationErrors(errorBody?.errors)
      const serverMessage = errorBody?.message || errorBody?.error
      errorMessage = [serverMessage, validationDetails].filter(Boolean).join(': ') || errorMessage
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

export const httpPatch = <T>(path: string, body?: unknown, options?: HttpOptions) =>
  http<T>(path, {
    ...options,
    method: 'PATCH',
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

export const httpDelete = <T>(path: string, options?: HttpOptions) =>
  http<T>(path, { ...options, method: 'DELETE' })
