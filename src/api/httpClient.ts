import * as AuthStorage from '../context/Auth/AuthStorage'
import { API_URL } from './config'

export type RequestOptions = RequestInit & {
  skipAuth?: boolean
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

const buildUrl = (input: RequestInfo | URL) => {
  if (typeof input !== 'string') {
    return input
  }

  if (isAbsoluteUrl(input)) {
    return input
  }

  return `${trimTrailingSlash(API_URL)}${normalizePath(input)}`
}

export async function request<T>(input: RequestInfo | URL, init: RequestOptions = {}): Promise<T> {
  const session = AuthStorage.getSession()
  const { skipAuth, ...requestInit } = init
  const headers = new Headers(init.headers)

  if (!skipAuth && session?.accessToken && !headers.has('Authorization')) {
    //  headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  const response = await fetch(buildUrl(input), {
    ...requestInit,
    headers,
  })

  if (!response.ok) {
    let responseText = ''

    try {
      responseText = await response.text()
    } catch {
      responseText = ''
    }

    const statusText = response.statusText ? ` ${response.statusText}` : ''
    const details = responseText ? `: ${responseText}` : ''

    throw new Error(`Error ${response.status}${statusText}${details}`)
  }

  return (await response.json()) as T
}
