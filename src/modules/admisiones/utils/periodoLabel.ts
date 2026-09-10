export function buildAnioPeriodoLabel(anio: number, semestre: 1 | 2): string {
  return `${anio} - ${semestre}`
}

export function parseAnioPeriodoLabel(label: string): { anio: number; semestre: 1 | 2 } | null {
  const normalized = label.trim().replace(/\s+/g, ' ')
  const match = normalized.match(/^(\d{4})\s*-\s*([12])$/)

  if (!match) {
    return null
  }

  const anio = Number(match[1])
  const semestre = Number(match[2]) as 1 | 2

  if (!Number.isInteger(anio)) {
    return null
  }

  return { anio, semestre }
}
