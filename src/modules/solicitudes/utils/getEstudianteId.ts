import type { AuthSession, AuthUser } from '../../../context/Auth/types'

const hasNumericId = (value: unknown): value is { id: number } => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const maybeId = (value as { id?: unknown }).id
  return typeof maybeId === 'number'
}

export function getEstudianteId(session: AuthSession | null): number | null {
  if (!session || session.kind !== 'SAPP') {
    return null
  }

  const user = session.user as AuthUser
  return hasNumericId(user.estudiante) ? user.estudiante.id : null
}

export const getEstudianteIdFromSession = getEstudianteId
