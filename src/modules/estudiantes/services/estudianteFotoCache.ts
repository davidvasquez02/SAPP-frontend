/**
 * Cache de fotos (ANX-4) de estudiantes, fuera del ciclo de vida de cualquier componente.
 *
 * El listado de estudiantes tarda ~10s en resolver todas las fotos de un programa. Si el
 * coordinador entra al detalle de un estudiante antes de que termine, el useEffect del listado
 * se desmonta y descartaba el resultado (quedaba solo en el state del componente, que ya no
 * existe) — al volver al listado, ninguna foto aparecia aunque el fetch si habia terminado en
 * segundo plano. Guardar el resultado aca, afuera del componente, permite que ese fetch en
 * segundo plano siga siendo util: al volver, el listado reusa lo que ya quedo cacheado.
 */
const fotosPorEstudianteId = new Map<number, string>()

export const getFotoCacheada = (estudianteId: number): string | undefined =>
  fotosPorEstudianteId.get(estudianteId)

export const setFotoCacheada = (estudianteId: number, fotoUrl: string): void => {
  fotosPorEstudianteId.set(estudianteId, fotoUrl)
}

/** Para cada estudiante sin fotoUrl propia, la completa con la cacheada (si existe). */
export const aplicarFotosCacheadas = <T extends { id: number; fotoUrl?: string | null }>(
  estudiantes: T[],
): T[] =>
  estudiantes.map((estudiante) => {
    if (estudiante.fotoUrl) {
      return estudiante
    }

    const fotoUrl = getFotoCacheada(estudiante.id)
    return fotoUrl ? { ...estudiante, fotoUrl } : estudiante
  })
