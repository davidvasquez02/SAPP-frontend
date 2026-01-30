import * as AuthStorage from '../context/Auth/AuthStorage'

export type RequestOptions = RequestInit & {
  skipAuth?: boolean
}

export async function request<T>(input: RequestInfo, init: RequestOptions = {}): Promise<T> {
  const session = AuthStorage.getSession()
  const { skipAuth, ...requestInit } = init
  const headers = new Headers(init.headers)

  if (!skipAuth && session?.accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  const response = await fetch(input, {
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
