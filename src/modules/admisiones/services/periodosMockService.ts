import { periodosMock } from '../mock/periodos.mock'
import type { PeriodoOption } from '../mock/periodos.mock'

export async function fetchPeriodos(): Promise<PeriodoOption[]> {
  await new Promise((resolve) => setTimeout(resolve, 150))
  return periodosMock
}
