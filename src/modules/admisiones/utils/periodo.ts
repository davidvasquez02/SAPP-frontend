export const parsePeriodo = (periodo: string): { anio: number; semestre: number } => {
  const normalized = periodo?.trim() ?? ''
  const match = normalized.match(/(\d{4})\s*-\s*(\d+)/)

  if (!match) {
    return { anio: 0, semestre: 0 }
  }

  const anio = Number(match[1])
  const semestre = Number(match[2])

  if (Number.isNaN(anio) || Number.isNaN(semestre)) {
    return { anio: 0, semestre: 0 }
  }

  return { anio, semestre }
}
