export interface PromedioPuntajeRegla {
  promedioMin: number
  promedioMax: number
  puntos: number
}

export const getPromedioPuntajeReglas = (value: unknown): PromedioPuntajeRegla[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null

  const reglas = value.filter((entry): entry is PromedioPuntajeRegla => {
    if (!entry || typeof entry !== 'object') return false
    const candidate = entry as Record<string, unknown>
    return (
      typeof candidate.promedioMin === 'number' &&
      Number.isFinite(candidate.promedioMin) &&
      typeof candidate.promedioMax === 'number' &&
      Number.isFinite(candidate.promedioMax) &&
      typeof candidate.puntos === 'number' &&
      Number.isFinite(candidate.puntos)
    )
  })

  return reglas.length === value.length ? reglas : null
}

export const formatPromedio = (value: number): string =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(value)

export const getPromedioRangoLabel = (regla: PromedioPuntajeRegla): string =>
  regla.promedioMin === regla.promedioMax
    ? formatPromedio(regla.promedioMin)
    : `${formatPromedio(regla.promedioMin)}–${formatPromedio(regla.promedioMax)}`
