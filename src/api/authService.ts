import type { AuthSession } from '../context/Auth'

export const login = async (username: string, password: string): Promise<AuthSession> => {
  if (!username.trim() || !password.trim()) {
    throw new Error('Credenciales inválidas')
  }

  return {
    kind: 'SAPP',
    accessToken: 'mock-token',
    user: {
      id: 1,
      username,
      roles: ['ESTUDIANTE'],
      nombreCompleto: 'Usuario Demo',
      programa: 'MAESTRIA',
    },
  }
}
