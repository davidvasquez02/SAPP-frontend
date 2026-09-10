import type { AuthSession } from './types'

const STORAGE_KEY = 'SAPP_AUTH_SESSION'

export const getSession = (): AuthSession | null => {
  const storedSession = localStorage.getItem(STORAGE_KEY)
  if (!storedSession) {
    return null
  }

  try {
    return JSON.parse(storedSession) as AuthSession
  } catch {
    return null
  }
}

export const setSession = (session: AuthSession): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export const clearSession = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}
