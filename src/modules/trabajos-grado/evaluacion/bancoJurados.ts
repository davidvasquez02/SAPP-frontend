const BANCO_JURADOS_PATH = '/sapp/procesoEvaluacionTg/jurados/banco'

export const buildBancoJuradosPath = (query = ''): string => {
  const normalizedQuery = query.trim()
  return normalizedQuery
    ? `${BANCO_JURADOS_PATH}?q=${encodeURIComponent(normalizedQuery)}`
    : BANCO_JURADOS_PATH
}
