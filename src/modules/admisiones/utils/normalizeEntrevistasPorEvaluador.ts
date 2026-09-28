export const normalizeEntrevistasPorEvaluador = <T>(
  data: T[] | null | undefined,
): T[] => (Array.isArray(data) ? data : [])
