const redirectStatuses = [301, 302, 303, 307, 308]

const isRedirect = (response: Response) =>
  response.type === 'opaqueredirect' || redirectStatuses.includes(response.status)

export async function fetchApi(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const request = input instanceof Request ? input : undefined
  if (init.redirect || request) {
    return fetch(input, init)
  }

  const options: RequestInit = { ...init, redirect: 'manual' }
  const response = await fetch(input, options)
  if (!isRedirect(response)) return response

  const method = (init.method ?? 'GET').toUpperCase()
  if (method === 'GET' || method === 'HEAD') {
    const retry = await fetch(input, { ...options, cache: 'reload' })
    if (!isRedirect(retry)) return retry
  }

  throw new Error('El servidor redirigió la petición. Si estabas guardando, verifica el estado del trámite antes de volver a enviarlo. Si el problema persiste, guarda una copia de tus cambios y recarga la página.')
}
