const ESTADOS_AGENDABLES = new Set([
  'CONCEPTOS_REC',
  'CONCEPTOS_RECIBIDOS',
  'EN_AJUSTES',
  'AJUSTES_RECIB',
  'AJUSTES_RECIBIDOS',
])

const normalizarEstadoProceso = (estado: string): string =>
  estado.trim().toLocaleUpperCase('es-CO').replace(/[\s-]+/g, '_')

export const puedeAgendarSustentacion = (estado: string): boolean =>
  ESTADOS_AGENDABLES.has(normalizarEstadoProceso(estado))
