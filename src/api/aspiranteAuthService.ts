import type { AuthSession } from '../context/Auth'

export interface AspiranteLoginParams {
  numeroInscripcion: string
  tipoDocumentoId: number
  numeroDocumento: string
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const loginAspirante = async (
  params: AspiranteLoginParams,
): Promise<AuthSession> => {
  const { numeroInscripcion, tipoDocumentoId, numeroDocumento } = params

  if (!numeroInscripcion.trim() || !tipoDocumentoId || !numeroDocumento.trim()) {
    throw new Error('Parámetros incompletos')
  }

  await delay(800)

  return {
    kind: 'ASPIRANTE',
    accessToken: 'mock-aspirante-token',
    user: {
      id: 999,
      roles: ['ASPIRANTE'],
      numeroInscripcion: numeroInscripcion.trim(),
      tipoDocumentoId,
      numeroDocumento: numeroDocumento.trim(),
    },
  }
}
