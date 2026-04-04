export type PeriodoOption = {
  id: number
  label: string
  anio: number
  semestre: 1 | 2
}

export const periodosMock: PeriodoOption[] = [
  { id: 1, label: '2026-1', anio: 2026, semestre: 1 },
  { id: 2, label: '2026-2', anio: 2026, semestre: 2 },
  { id: 3, label: '2025-2', anio: 2025, semestre: 2 },
]
