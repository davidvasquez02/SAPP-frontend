import * as AuthStorage from '../context/Auth/AuthStorage'

export async function request<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
  const session = AuthStorage.getSession()
  const headers = new Headers(init.headers)

  if (session?.accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  const response = await fetch(input, {
    ...init,
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
