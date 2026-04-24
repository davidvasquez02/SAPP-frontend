export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  const bytes = new Uint8Array(hash)

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
