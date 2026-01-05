import type { AuthUser } from '../context/Auth'

type LoginPayload = {
  username: string
  password: string
}

const ROLE_BY_USERNAME: Record<string, AuthUser['role']> = {
  secretaria: 'SECRETARIA',
  coordinacion: 'COORDINACION',
  comite: 'COMITE',
  docente: 'DOCENTE',
  aspirante: 'ASPIRANTE',
  invitado: 'INVITADO',
}

export const loginMock = async ({ username, password }: LoginPayload): Promise<AuthUser> => {
  if (!username.trim() || !password.trim()) {
    throw new Error('Usuario y contraseña son obligatorios.')
  }

  const normalized = username.trim().toLowerCase()
  const role = ROLE_BY_USERNAME[normalized] ?? 'ESTUDIANTE'

  return {
    id: `mock-${normalized}`,
    name: username.trim(),
    role,
  }
}
