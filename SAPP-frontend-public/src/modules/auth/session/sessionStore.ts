import type { AuthSession } from '../../../context/Auth/types'

const STORAGE_KEY = 'SAPP_AUTH_SESSION'
const LEGACY_STORAGE_KEY = 'session'
const NO_TOKEN_VALUE = 'NO_TOKEN'

let cachedSession: AuthSession | null = null

const parseSession = (raw: string | null): AuthSession | null => {
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export const getSession = (): AuthSession | null => {
  if (cachedSession) {
    return cachedSession
  }

  const storedSession =
    parseSession(localStorage.getItem(STORAGE_KEY)) ??
    parseSession(localStorage.getItem(LEGACY_STORAGE_KEY))

  cachedSession = storedSession

  return storedSession
}

export function getToken(): string | null {
  const session = cachedSession ?? getSession()
  const token = session?.accessToken ?? null

  if (!token || token === NO_TOKEN_VALUE) {
    return null
  }

  return token
}

export function saveSession(session: AuthSession): void {
  cachedSession = session
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  cachedSession = null
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}
