import type { EvaluacionAvailability } from './evaluacionAdmisionAvailabilityService'

const CACHE_TTL_MS = 30_000
const availabilityCache = new Map<
  number,
  { value: EvaluacionAvailability; ts: number }
>()

export const getCachedEvaluacionAvailability = (
  inscripcionId: number,
): EvaluacionAvailability | null => {
  const cached = availabilityCache.get(inscripcionId)
  if (!cached) {
    return null
  }

  if (Date.now() - cached.ts > CACHE_TTL_MS) {
    availabilityCache.delete(inscripcionId)
    return null
  }

  return cached.value
}

export const setCachedEvaluacionAvailability = (
  inscripcionId: number,
  value: EvaluacionAvailability,
) => {
  availabilityCache.set(inscripcionId, { value, ts: Date.now() })
}
