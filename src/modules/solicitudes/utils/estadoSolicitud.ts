export type EstadoSolicitud = 'REGISTRADA' | 'EN ESTUDIO' | 'APROBADA' | 'RECHAZADA'

const ESTADO_MAP: Record<string, EstadoSolicitud> = {
  REGISTRADA: 'REGISTRADA',
  'EN ESTUDIO': 'EN ESTUDIO',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
}

export function normalizeEstadoSolicitud(value: string | null | undefined): EstadoSolicitud | 'UNKNOWN' {
  if (!value) {
    return 'UNKNOWN'
  }

  const normalized = value.trim().toUpperCase()
  return ESTADO_MAP[normalized] ?? 'UNKNOWN'
}
