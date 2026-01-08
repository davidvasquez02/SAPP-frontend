import type { AuthSession } from '../context/Auth'

export const loginAspirante = async (numeroAspirante: string): Promise<AuthSession> => {
  if (!numeroAspirante.trim()) {
    throw new Error('Número de aspirante requerido')
  }

  if (numeroAspirante.trim().length < 4) {
    throw new Error('Número de aspirante inválido')
  }

  return {
    kind: 'ASPIRANTE',
    accessToken: 'mock-aspirante-token',
    user: {
      id: 999,
      numeroAspirante: numeroAspirante.trim(),
      roles: ['ASPIRANTE'],
      programa: 'MAESTRIA',
      nombres: 'Aspirante',
      apellidos: 'Demo',
    },
  }
}
