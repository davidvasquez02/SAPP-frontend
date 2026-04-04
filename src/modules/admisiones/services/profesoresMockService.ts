import { profesoresMock } from '../mock/profesores.mock'
import type { ProfesorOption } from '../mock/profesores.mock'

export async function fetchProfesores(): Promise<ProfesorOption[]> {
  await new Promise((resolve) => setTimeout(resolve, 150))
  return profesoresMock
}
