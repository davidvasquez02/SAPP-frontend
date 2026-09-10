const decodeBase64Unicode = (binary: string): string => {
  if (typeof TextDecoder !== 'undefined') {
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }

  return decodeURIComponent(escape(binary))
}

export const base64UrlDecode = (input: string): string => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padLength = (4 - (base64.length % 4)) % 4
  const padded = `${base64}${'='.repeat(padLength)}`
  const binary = atob(padded)

  return decodeBase64Unicode(binary)
}

export const decodeJwtPayload = <T = unknown>(token: string): T => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Token inválido')
  }

  const payloadPart = parts[1]
  const jsonStr = base64UrlDecode(payloadPart)

  return JSON.parse(jsonStr) as T
}
