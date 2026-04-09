import { estudiantesMock, programasMock } from '../mock/estudiantes.mock'
import type { EstudianteCoordinacion, ProgramaCoordinacion } from '../types'

const MOCK_DELAY_MS = 200

const delay = async () => {
  await new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS)
  })
}

export const getProgramasCoordinacion = async (): Promise<ProgramaCoordinacion[]> => {
  await delay()
  return [...programasMock]
}

export const getEstudiantesByPrograma = async (
  programaId: number
): Promise<EstudianteCoordinacion[]> => {
  await delay()
  return estudiantesMock.filter((estudiante) => estudiante.programaId === programaId)
}

export const getEstudianteById = async (
  estudianteId: number
): Promise<EstudianteCoordinacion | null> => {
  await delay()
  return estudiantesMock.find((estudiante) => estudiante.id === estudianteId) ?? null
}
