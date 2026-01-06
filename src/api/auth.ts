import type { AuthSession, RoleCode } from '../context/Auth'

type LoginPayload = {
  username: string
  password: string
}

const ROLE_BY_USERNAME: Record<string, RoleCode> = {
  secretaria: 'SECRETARIA',
  coordinacion: 'COORDINACION',
  comite: 'COMITE',
  docente: 'DOCENTE',
  aspirante: 'ASPIRANTE',
  invitado: 'INVITADO',
}

export const loginMock = async ({ username, password }: LoginPayload): Promise<AuthSession> => {
  if (!username.trim() || !password.trim()) {
    throw new Error('Usuario y contraseña son obligatorios.')
  }

  const normalized = username.trim().toLowerCase()
  const role = ROLE_BY_USERNAME[normalized] ?? 'ESTUDIANTE'

  return {
    accessToken: `mock-token-${normalized}`,
    user: {
      id: Date.now(),
      username: username.trim(),
      roles: [role],
      nombreCompleto: username.trim(),
    },
  }
}
